import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { OfficeClaim } from '../../models/OfficeClaim.js';
import { User } from '../../models/User.js';
import { Office } from '../../models/Office.js';
import { Issue } from '../../models/Issue.js';
import { ModerationReport } from '../../models/ModerationReport.js';
import { PasswordUtil } from '../../utils/password.util.js';
import { SessionService } from '../../services/session.service.js';
import { AuditService } from '../../services/audit.service.js';
import { Jurisdiction } from '../../models/Jurisdiction.js';
import { EscalationService } from '../../services/escalation.service.js';
import { Raise } from '../../models/Raise.js';
import { RepresentativeProfile } from '../../models/RepresentativeProfile.js';
import { OutreachRecord } from '../../models/OutreachRecord.js';
import { CorrectionRequest } from '../../models/CorrectionRequest.js';
import { RepresentativeUpdate } from '../../models/RepresentativeUpdate.js';
import { FreezeWindow } from '../../models/FreezeWindow.js';
import { MetricsService } from '../../services/metrics.service.js';
import { MonthlyReportService } from '../../services/monthly-report.service.js';
import { config } from '../../config/env.js';
import { z } from 'zod';

export class AdminController {
  /**
   * List official / contractor verification claims
   */
  static async getClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const filter: any = {};

      if (status && status !== 'all') {
        filter.status = status;
      }

      const claims = await OfficeClaim.find(filter)
        .populate('userId', 'displayName name email phoneMasked role status createdAt')
        .populate('officeId', 'name nameMr department level jurisdiction kind claimStatus')
        .populate('jurisdictionId', 'name code level type')
        .populate('representativeProfileId', 'displayName role status')
        .populate('reviewedBy', 'displayName email')
        .sort({ createdAt: -1 });

      const unclaimedProfiles = await RepresentativeProfile.find({ status: 'unclaimed' })
        .populate('jurisdictionId', 'name code level')
        .sort({ displayName: 1 });

      res.json({
        success: true,
        claims,
        unclaimedProfiles,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Approve claim: activates user, assigns office membership, updates profile and office claim status
   */
  static async approveClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { linkProfileId } = req.body || {};
      const claim = await OfficeClaim.findById(id);

      if (!claim) {
        res.status(404).json({ success: false, message: 'Verification claim not found.' });
        return;
      }

      if (claim.status === 'approved') {
        res.status(400).json({ success: false, message: 'Claim is already approved.' });
        return;
      }

      claim.status = 'approved';
      claim.reviewedBy = new mongoose.Types.ObjectId(req.user?.userId);
      claim.reviewedAt = new Date();
      if (linkProfileId) {
        claim.representativeProfileId = new mongoose.Types.ObjectId(linkProfileId);
      }
      await claim.save();

      // Activate user account and grant office privileges
      const user = await User.findById(claim.userId);
      let memberRole: 'head' | 'officer' | 'contractor' | 'staff' | 'office_admin' = 'officer';

      if (claim.accountType === 'representative') {
        memberRole = 'office_admin';
      } else if (claim.accountType === 'representative_staff' || claim.isStaff) {
        memberRole = 'staff';
      } else if (claim.role === 'agency' || claim.accountType === 'agency_contractor') {
        memberRole = 'contractor';
      }

      if (user && claim.officeId) {
        user.status = 'active';
        user.isOfficialVerified = true;
        user.role = 'official';
        user.officialOfficeId = claim.officeId;

        const existingIdx = user.officeMemberships.findIndex(
          (m) => m.officeId.toString() === claim.officeId!.toString()
        );

        if (existingIdx >= 0) {
          user.officeMemberships[existingIdx].status = 'active';
          user.officeMemberships[existingIdx].memberRole = memberRole;
        } else {
          user.officeMemberships.push({
            officeId: claim.officeId,
            memberRole,
            status: 'active',
          });
        }

        await user.save();
      }

      // Handle RepresentativeProfile verification & linking
      if (claim.accountType === 'representative' || claim.accountType === 'representative_staff') {
        const targetProfileId = linkProfileId || claim.representativeProfileId;
        let profile = targetProfileId ? await RepresentativeProfile.findById(targetProfileId) : null;

        if (!profile && claim.accountType === 'representative' && claim.jurisdictionId && claim.representativeRole) {
          profile = await RepresentativeProfile.findOne({
            jurisdictionId: claim.jurisdictionId,
            role: claim.representativeRole as any,
            status: 'unclaimed',
          });
        }

        if (profile) {
          profile.status = 'verified';
          if (claim.officeId) {
            profile.officeId = claim.officeId;
          }
          if (user && claim.accountType === 'representative') {
            profile.displayName = user.name;
          }
          profile.verification = {
            method: 'document_certificate',
            evidenceFileIds: claim.documentUrl ? [claim.documentUrl] : [],
            reviewedBy: new mongoose.Types.ObjectId(req.user?.userId),
            reviewedAt: new Date(),
            notes: 'Verified and approved by platform administrator',
          };
          await profile.save();

          // Update OutreachRecord if exists
          await OutreachRecord.findOneAndUpdate(
            { targetType: 'representative', targetId: profile._id },
            {
              status: 'joined',
              notes: `Claim verified for ${user?.name || 'Representative'} (${claim.workEmail})`,
              lastContactedAt: new Date(),
            }
          );
        } else if (claim.accountType === 'representative' && claim.jurisdictionId && claim.representativeRole && claim.officeId) {
          const newProfile = await RepresentativeProfile.create({
            officeId: claim.officeId,
            role: claim.representativeRole as any,
            titleText: claim.designation,
            jurisdictionId: claim.jurisdictionId,
            termStart: claim.termStart || new Date(),
            termEnd: claim.termEnd || new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000),
            status: 'verified',
            displayName: user?.name || claim.designation,
            officialSiteUrl: claim.officialSiteUrl,
            verification: {
              method: 'document_certificate',
              evidenceFileIds: claim.documentUrl ? [claim.documentUrl] : [],
              reviewedBy: new mongoose.Types.ObjectId(req.user?.userId),
              reviewedAt: new Date(),
              notes: 'Created and verified on claim approval',
            },
          });

          await OutreachRecord.findOneAndUpdate(
            { targetType: 'representative', targetId: newProfile._id },
            {
              status: 'joined',
              notes: `Representative onboarded directly (${claim.workEmail})`,
              lastContactedAt: new Date(),
            },
            { upsert: true }
          );
        }
      }

      // Update office record
      if (claim.officeId) {
        const office = await Office.findById(claim.officeId);
        if (office) {
          office.claimStatus = 'claimed';
          office.claimedBy = claim.userId;
          await office.save();

          // Update office outreach record
          await OutreachRecord.findOneAndUpdate(
            { targetType: 'office', targetId: office._id },
            {
              status: 'joined',
              notes: `Office claimed and approved (${claim.workEmail})`,
              lastContactedAt: new Date(),
            }
          );
        }
      }

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'claim_approved',
        targetType: 'claim',
        targetId: claim._id.toString(),
        details: {
          userId: claim.userId.toString(),
          officeId: claim.officeId?.toString(),
          accountType: claim.accountType,
          memberRole,
        },
      });

      console.info(
        `[AUDIT] Admin ${req.user?.email || req.user?.userId} approved claim ${claim._id} for user ${claim.userId}`
      );

      res.json({
        success: true,
        message: 'Claim approved successfully. User activated with office access.',
        claim,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reject claim with explicit reason
   */
  static async rejectClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const claim = await OfficeClaim.findById(id);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Verification claim not found.' });
        return;
      }

      claim.status = 'rejected';
      claim.rejectionReason = reason || 'Documentation could not be verified by platform administrator.';
      claim.reviewedBy = new mongoose.Types.ObjectId(req.user?.userId);
      claim.reviewedAt = new Date();
      await claim.save();

      console.info(
        `[AUDIT] Admin ${req.user?.email || req.user?.userId} rejected claim ${claim._id}. Reason: ${claim.rejectionReason}`
      );

      res.json({
        success: true,
        message: 'Claim rejected.',
        claim,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request additional verification details from applicant
   */
  static async requestInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const claim = await OfficeClaim.findById(id);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Verification claim not found.' });
        return;
      }

      claim.status = 'needs_info';
      claim.adminNotes = notes || 'Please provide additional supporting documentation.';
      claim.reviewedBy = new mongoose.Types.ObjectId(req.user?.userId);
      claim.reviewedAt = new Date();
      await claim.save();

      res.json({
        success: true,
        message: 'Claim flagged for additional information.',
        claim,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin dashboard stats & KPIs
   */
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeCitizens = await User.countDocuments({ role: 'citizen', status: 'active' });
      const pendingClaims = await OfficeClaim.countDocuments({ status: 'pending' });
      const flaggedReports = await ModerationReport.countDocuments({ status: 'pending' });

      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const overdueEscalations = await Issue.countDocuments({
        status: 'submitted',
        createdAt: { $lte: twoDaysAgo },
      });

      res.json({
        success: true,
        stats: {
          activeCitizens,
          pendingClaims,
          flaggedReports,
          overdueEscalations,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Set temporary password for user (forces password change on next login, revokes all sessions).
   */
  static async setTemporaryPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { temporaryPassword } = req.body;

      if (!temporaryPassword || typeof temporaryPassword !== 'string') {
        res.status(400).json({ success: false, message: 'Temporary password is required.' });
        return;
      }

      const passCheck = PasswordUtil.validate(temporaryPassword);
      if (!passCheck.valid) {
        res.status(400).json({ success: false, message: passCheck.reason });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      user.passwordHash = await PasswordUtil.hash(temporaryPassword);
      user.needsPasswordChange = true;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      await SessionService.revokeAllUserSessions(user._id.toString());

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'admin_set_temporary_password',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Temporary password set successfully. User will be forced to change password at next login.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Run automated SLA breach escalation ladder on-demand (admin test endpoint)
   */
  static async runEscalations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EscalationService.runEscalationCheck();
      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'admin_run_escalations',
        targetType: 'system',
        details: {
          checkedCount: result.checkedCount,
          escalatedCount: result.escalatedCount,
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: `Escalation check complete: checked ${result.checkedCount} issues, escalated ${result.escalatedCount}.`,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all jurisdictions and attached offices for admin mapping interface
   */
  /**
   * Internal helper to compute pilot operational metrics
   */
  static async computePilotMetrics() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allIssues = await Issue.find({ status: { $ne: 'draft' } }).sort({ createdAt: -1 });
    const totalIssues = allIssues.length;
    const issuesThisWeek = allIssues.filter((i) => i.createdAt >= sevenDaysAgo).length;

    // Acknowledged issues
    const ackStatuses = ['acknowledged', 'in_progress', 'resolved_pending_confirmation', 'resolved'];
    const ackIssues = allIssues.filter((i) => ackStatuses.includes(i.status));

    let ackOnTimeCount = 0;
    const ackDurationsHours: number[] = [];

    for (const issue of ackIssues) {
      const ackEvent = issue.statusTimeline?.find((t: any) => ackStatuses.includes(t.status));
      const ackTime = ackEvent ? new Date(ackEvent.updatedAt) : new Date(issue.updatedAt);
      const createdAt = new Date(issue.createdAt);

      const durHours = Math.max(0, (ackTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      ackDurationsHours.push(durHours);

      const deadline = issue.slaDeadline || new Date(createdAt.getTime() + (issue.slaHours || 48) * 3600 * 1000);
      if (ackTime.getTime() <= deadline.getTime()) {
        ackOnTimeCount++;
      }
    }

    const percentAcknowledgedWithinSla =
      ackIssues.length > 0 ? Math.round((ackOnTimeCount / ackIssues.length) * 100 * 10) / 10 : 0;

    ackDurationsHours.sort((a, b) => a - b);
    const medianTimeToAcknowledge =
      ackDurationsHours.length > 0
        ? Math.round(
            (ackDurationsHours.length % 2 !== 0
              ? ackDurationsHours[Math.floor(ackDurationsHours.length / 2)]
              : (ackDurationsHours[ackDurationsHours.length / 2 - 1] +
                  ackDurationsHours[ackDurationsHours.length / 2]) /
                2) * 10
          ) / 10
        : 0;

    // Resolved issues
    const resStatuses = ['resolved_pending_confirmation', 'resolved'];
    const resolvedIssues = allIssues.filter((i) => resStatuses.includes(i.status) || i.resolvedAt);
    const resolvedCount = resolvedIssues.length;
    const resolutionRate =
      totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100 * 10) / 10 : 0;

    const resolveDurationsHours: number[] = [];
    let confirmedCount = 0;
    let disputedCount = 0;

    for (const issue of resolvedIssues) {
      const resTime = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date(issue.updatedAt);
      const createdAt = new Date(issue.createdAt);
      const durHours = Math.max(0, (resTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      resolveDurationsHours.push(durHours);

      if (
        issue.confirmationStatus === 'resolved_confirmed' ||
        (issue.confirmedByCount && issue.confirmedByCount > 0)
      ) {
        confirmedCount++;
      }
      if (
        issue.status === 'disputed' ||
        (issue.disputedByCount && issue.disputedByCount > 0) ||
        (issue.disputes && issue.disputes.length > 0)
      ) {
        disputedCount++;
      }
    }

    resolveDurationsHours.sort((a, b) => a - b);
    const medianTimeToResolve =
      resolveDurationsHours.length > 0
        ? Math.round(
            (resolveDurationsHours.length % 2 !== 0
              ? resolveDurationsHours[Math.floor(resolveDurationsHours.length / 2)]
              : (resolveDurationsHours[resolveDurationsHours.length / 2 - 1] +
                  resolveDurationsHours[resolveDurationsHours.length / 2]) /
                2) * 10
          ) / 10
        : 0;

    const confirmedRate =
      resolvedCount > 0 ? Math.round((confirmedCount / resolvedCount) * 100 * 10) / 10 : 0;
    const disputeRate =
      resolvedCount > 0 ? Math.round((disputedCount / resolvedCount) * 100 * 10) / 10 : 0;

    // Escalations
    const escalationCount = allIssues.filter(
      (i) =>
        (i.escalationLevel && i.escalationLevel > 0) ||
        (i.escalationHistory && i.escalationHistory.length > 0)
    ).length;

    // Repeat users
    const authorCounts = await Issue.aggregate([
      { $match: { authorId: { $exists: true, $ne: null } } },
      { $group: { _id: '$authorId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } },
    ]);
    const raiserCounts = await Raise.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } },
    ]);
    const repeatSet = new Set<string>();
    authorCounts.forEach((a) => repeatSet.add(a._id.toString()));
    raiserCounts.forEach((r) => repeatSet.add(r._id.toString()));
    const repeatUsersCount = repeatSet.size;

    return {
      summary: {
        issuesThisWeek,
        totalIssues,
        percentAcknowledgedWithinSla,
        medianTimeToAcknowledge,
        medianTimeToResolve,
        resolutionRate,
        confirmedRate,
        disputeRate,
        escalationCount,
        repeatUsersCount,
      },
      issues: allIssues,
    };
  }

  /**
   * Get Pilot Metrics JSON payload
   */
  static async getPilotMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminController.computePilotMetrics();
      res.json({
        success: true,
        metrics: data.summary,
        totalIssuesCount: data.issues.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export Pilot Metrics CSV for daily standup operations
   */
  static async exportPilotMetricsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { summary, issues } = await AdminController.computePilotMetrics();

      let csv = `RAISE Pilot Metrics & Standup Report\n`;
      csv += `Generated At,${new Date().toISOString()}\n`;
      csv += `Environment,${config.nodeEnv}\n\n`;

      csv += `SUMMARY METRICS\n`;
      csv += `Metric,Value,Unit\n`;
      csv += `Issues Filed This Week,${summary.issuesThisWeek},issues\n`;
      csv += `Total Issues Filed,${summary.totalIssues},issues\n`;
      csv += `Acknowledged Within SLA,${summary.percentAcknowledgedWithinSla},%\n`;
      csv += `Median Time to Acknowledge,${summary.medianTimeToAcknowledge},hours\n`;
      csv += `Median Time to Resolve,${summary.medianTimeToResolve},hours\n`;
      csv += `Resolution Rate,${summary.resolutionRate},%\n`;
      csv += `Confirmed by Citizen Rate,${summary.confirmedRate},%\n`;
      csv += `Dispute Rate,${summary.disputeRate},%\n`;
      csv += `Escalation Count,${summary.escalationCount},issues\n`;
      csv += `Repeat Users Count,${summary.repeatUsersCount},citizens\n\n`;

      csv += `WARD GRIEVANCES DETAILS\n`;
      csv += `Issue ID,Title,Category,Ward,Status,Escalation Level,Created At,SLA Deadline,Resolved At,Confirmed,Disputed\n`;

      for (const issue of issues) {
        const cleanTitle = `"${(issue.title || '').replace(/"/g, '""')}"`;
        const cleanWard = `"${(issue.location?.ward || 'Ward 12').replace(/"/g, '""')}"`;
        const confirmed =
          issue.confirmationStatus === 'resolved_confirmed' ||
          (issue.confirmedByCount && issue.confirmedByCount > 0)
            ? 'Yes'
            : 'No';
        const disputed =
          issue.status === 'disputed' ||
          (issue.disputedByCount && issue.disputedByCount > 0) ||
          (issue.disputes && issue.disputes.length > 0)
            ? 'Yes'
            : 'No';
        csv += `${issue._id},${cleanTitle},${issue.category},${cleanWard},${issue.status},${issue.escalationLevel || 0},${
          issue.createdAt ? issue.createdAt.toISOString() : ''
        },${issue.slaDeadline ? issue.slaDeadline.toISOString() : ''},${
          issue.resolvedAt ? issue.resolvedAt.toISOString() : ''
        },${confirmed},${disputed}\n`;
      }

      const today = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="raise-pilot-metrics-${today}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all jurisdictions and attached offices for admin mapping interface
   */
  static async getJurisdictions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jurisdictions = await Jurisdiction.find().sort({ type: 1, name: 1 });
      const offices = await Office.find().populate('jurisdictionId', 'name type');

      res.json({
        success: true,
        jurisdictions,
        offices,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Helper to retrieve and aggregate outreach items
   */
  private static async fetchOutreachData(targetType?: string, status?: string, search?: string) {
    const openStatuses = ['submitted', 'acknowledged', 'under_review', 'in_progress'];
    const outreachRecords = await OutreachRecord.find();
    const outreachMap = new Map<string, any>();
    for (const r of outreachRecords) {
      outreachMap.set(`${r.targetType}_${r.targetId.toString()}`, r);
    }

    const items: any[] = [];

    // 1. Process Representatives
    if (!targetType || targetType === 'all' || targetType === 'representative') {
      const reps = await RepresentativeProfile.find({ status: 'unclaimed' }).populate('jurisdictionId');
      
      // Calculate open issues per jurisdiction
      const repJurIds = reps.map((r) => r.jurisdictionId?._id).filter(Boolean);
      const repIssueCounts = await Issue.aggregate([
        { $match: { jurisdictionIds: { $in: repJurIds }, status: { $in: openStatuses } } },
        { $unwind: '$jurisdictionIds' },
        { $match: { jurisdictionIds: { $in: repJurIds } } },
        { $group: { _id: '$jurisdictionIds', count: { $sum: 1 } } },
      ]);
      const repCountMap = new Map<string, number>();
      for (const c of repIssueCounts) {
        repCountMap.set(c._id.toString(), c.count);
      }

      for (const rep of reps) {
        const jur = rep.jurisdictionId as any;
        const jurIdStr = jur?._id ? jur._id.toString() : '';
        const openIssues = repCountMap.get(jurIdStr) || 0;
        const key = `representative_${rep._id.toString()}`;
        const record = outreachMap.get(key);

        items.push({
          id: record?._id?.toString() || key,
          targetType: 'representative',
          targetId: rep._id.toString(),
          name: rep.displayName,
          role: rep.role,
          titleText: rep.titleText,
          jurisdictionName: jur?.name || 'Constituency',
          jurisdictionCode: jur?.code || '',
          jurisdictionLevel: jur?.level || jur?.type || '',
          openIssuesCount: openIssues,
          outreachStatus: record?.status || 'not_contacted',
          lastContactedAt: record?.lastContactedAt || null,
          notes: record?.notes || '',
          owner: record?.owner || '',
          officialSiteUrl: rep.officialSiteUrl || '',
        });
      }
    }

    // 2. Process Offices (excluding representative offices)
    if (!targetType || targetType === 'all' || targetType === 'office') {
      const offices = await Office.find({
        claimStatus: 'unclaimed',
        kind: { $ne: 'representative_office' },
      }).populate('jurisdictionId');

      const officeIds = offices.map((o) => o._id);
      const officeIssueCounts = await Issue.aggregate([
        { $match: { officeId: { $in: officeIds }, status: { $in: openStatuses } } },
        { $group: { _id: '$officeId', count: { $sum: 1 } } },
      ]);
      const officeCountMap = new Map<string, number>();
      for (const c of officeIssueCounts) {
        officeCountMap.set(c._id.toString(), c.count);
      }

      for (const off of offices) {
        const jur = off.jurisdictionId as any;
        const openIssues = officeCountMap.get(off._id.toString()) || 0;
        const key = `office_${off._id.toString()}`;
        const record = outreachMap.get(key);

        items.push({
          id: record?._id?.toString() || key,
          targetType: 'office',
          targetId: off._id.toString(),
          name: off.name,
          role: off.department,
          titleText: off.name,
          jurisdictionName: jur?.name || off.jurisdiction?.city || off.jurisdiction?.district || 'Administrative Area',
          jurisdictionCode: jur?.code || off.jurisdiction?.ward || '',
          jurisdictionLevel: off.level || off.kind || '',
          openIssuesCount: openIssues,
          outreachStatus: record?.status || 'not_contacted',
          lastContactedAt: record?.lastContactedAt || null,
          notes: record?.notes || '',
          owner: record?.owner || '',
          officialEmail: off.officialEmail || '',
        });
      }
    }

    // Filter by outreach status
    let filtered = items;
    if (status && status !== 'all') {
      filtered = filtered.filter((i) => i.outreachStatus === status);
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.role.toLowerCase().includes(q) ||
          i.titleText.toLowerCase().includes(q) ||
          i.jurisdictionName.toLowerCase().includes(q) ||
          i.jurisdictionCode.toLowerCase().includes(q) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    // Sort by open issues descending
    filtered.sort((a, b) => b.openIssuesCount - a.openIssuesCount);

    return filtered;
  }

  /**
   * Outreach queue listing unclaimed offices and representatives sorted by open issues
   */
  static async getOutreachQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetType, status, search } = req.query as {
        targetType?: string;
        status?: string;
        search?: string;
      };

      const items = await AdminController.fetchOutreachData(targetType, status, search);

      res.json({
        success: true,
        total: items.length,
        items,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update or create OutreachRecord
   */
  static async updateOutreachRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetType, targetId } = req.params;
      const { status, notes, lastContactedAt, owner } = req.body;

      if (!['office', 'representative'].includes(targetType)) {
        res.status(400).json({ success: false, message: 'Invalid targetType' });
        return;
      }

      const user = (req as any).user;
      const effectiveOwner = owner || user?.displayName || user?.email || 'admin';
      const effectiveLastContactedAt = lastContactedAt
        ? new Date(lastContactedAt)
        : status !== 'not_contacted'
        ? new Date()
        : null;

      const record = await OutreachRecord.findOneAndUpdate(
        { targetType, targetId: new mongoose.Types.ObjectId(targetId) },
        {
          targetType,
          targetId: new mongoose.Types.ObjectId(targetId),
          status: status || 'not_contacted',
          notes: notes !== undefined ? notes : '',
          lastContactedAt: effectiveLastContactedAt,
          owner: effectiveOwner,
        },
        { new: true, upsert: true }
      );

      await AuditService.log({
        actorId: user?._id,
        actorRole: user?.role,
        action: 'outreach_record_updated',
        targetType,
        targetId,
        details: {
          status: record.status,
          notes: record.notes,
          owner: record.owner,
        },
      });

      res.json({
        success: true,
        record,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export outreach queue as CSV
   */
  static async exportOutreachCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetType, status, search } = req.query as {
        targetType?: string;
        status?: string;
        search?: string;
      };

      const items = await AdminController.fetchOutreachData(targetType, status, search);

      let csv = 'Target Type,Name,Role / Dept,Jurisdiction,Open Issues,Outreach Status,Last Contacted,Notes,Owner\n';

      for (const item of items) {
        const cleanName = `"${(item.name || '').replace(/"/g, '""')}"`;
        const cleanRole = `"${(item.role || '').replace(/"/g, '""')}"`;
        const cleanJur = `"${(`${item.jurisdictionCode ? `[${item.jurisdictionCode}] ` : ''}${item.jurisdictionName}`).replace(/"/g, '""')}"`;
        const cleanNotes = `"${(item.notes || '').replace(/"/g, '""')}"`;
        const cleanOwner = `"${(item.owner || '').replace(/"/g, '""')}"`;
        const lastContact = item.lastContactedAt ? new Date(item.lastContactedAt).toISOString() : '';

        csv += `${item.targetType},${cleanName},${cleanRole},${cleanJur},${item.openIssuesCount},${item.outreachStatus},${lastContact},${cleanNotes},${cleanOwner}\n`;
      }

      const today = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="raise-outreach-queue-${today}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List correction requests
   */
  static async getCorrections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const filter: any = {};
      if (status && status !== 'all') {
        filter.status = status;
      }
      const corrections = await CorrectionRequest.find(filter)
        .sort({ createdAt: -1 })
        .populate('reviewedBy', 'displayName email');
      res.json({ success: true, corrections });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Review and resolve or reject a correction request
   */
  static async updateCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminNotes, outcome, recomputeMetrics } = req.body;

      const correction = await CorrectionRequest.findById(id);
      if (!correction) {
        res.status(404).json({ success: false, message: 'Correction request not found.' });
        return;
      }

      correction.status = status;
      correction.adminNotes = adminNotes;
      correction.outcome = outcome;
      correction.reviewedBy = new mongoose.Types.ObjectId(req.user!.userId);
      correction.reviewedAt = new Date();
      await correction.save();

      // If resolved and metric recompute requested, trigger calculation
      if (recomputeMetrics) {
        if (correction.targetType === 'office') {
          await MetricsService.computeOfficeMetrics(correction.targetId);
        } else if (correction.targetType === 'representative') {
          await MetricsService.computeRepresentativeMetrics(correction.targetId);
        }
      }

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'correction_request_reviewed',
        targetType: correction.targetType,
        targetId: correction.targetId.toString(),
        details: { status, outcome, recomputeMetrics },
      });

      res.json({ success: true, message: 'Correction request updated.', correction });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List representative updates for pre-moderation queue
   */
  static async getRepresentativeUpdates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const filter: any = {};
      if (status && status !== 'all') {
        filter.status = status;
      }

      const updates = await RepresentativeUpdate.find(filter)
        .populate('representativeProfileId', 'displayName role titleText photoUrl')
        .populate('authorId', 'displayName email')
        .populate('jurisdictionId', 'name code level')
        .populate('moderatedBy', 'displayName email')
        .sort({ createdAt: -1 });

      res.json({ success: true, updates });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Approve a representative update (Rule 6 Pre-moderation)
   */
  static async approveRepresentativeUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const update = await RepresentativeUpdate.findById(id);
      if (!update) {
        res.status(404).json({ success: false, message: 'Representative update not found.' });
        return;
      }

      update.status = 'published';
      update.moderatedBy = new mongoose.Types.ObjectId(req.user!.userId);
      update.moderatedAt = new Date();
      update.moderationReason = undefined;
      await update.save();

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'representative_update_approved',
        targetType: 'representative_update',
        targetId: update._id.toString(),
      });

      res.json({ success: true, message: 'Representative update approved and published.', update });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reject a representative update
   */
  static async rejectRepresentativeUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = z.object({ reason: z.string().min(5, 'Rejection reason must be at least 5 characters').max(500) }).parse(req.body);

      const update = await RepresentativeUpdate.findById(id);
      if (!update) {
        res.status(404).json({ success: false, message: 'Representative update not found.' });
        return;
      }

      update.status = 'rejected';
      update.moderatedBy = new mongoose.Types.ObjectId(req.user!.userId);
      update.moderatedAt = new Date();
      update.moderationReason = reason;
      await update.save();

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'representative_update_rejected',
        targetType: 'representative_update',
        targetId: update._id.toString(),
        details: { reason },
      });

      res.json({ success: true, message: 'Representative update rejected.', update });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all election freeze windows
   */
  static async getFreezeWindows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const windows = await FreezeWindow.find()
        .populate('jurisdictionId', 'name code level')
        .populate('createdBy', 'displayName email')
        .sort({ freezeStart: -1 });

      res.json({ success: true, windows });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create an election freeze window
   */
  static async createFreezeWindow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        jurisdictionId: z.string(),
        roles: z.array(z.string()).default([]),
        freezeStart: z.string(),
        freezeEnd: z.string(),
        reason: z.string().min(5, 'Reason must be at least 5 characters'),
      });
      const data = schema.parse(req.body);

      const window = await FreezeWindow.create({
        jurisdictionId: new mongoose.Types.ObjectId(data.jurisdictionId),
        roles: data.roles,
        freezeStart: new Date(data.freezeStart),
        freezeEnd: new Date(data.freezeEnd),
        reason: data.reason,
        createdBy: new mongoose.Types.ObjectId(req.user!.userId),
        isActive: true,
      });

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'election_freeze_window_created',
        targetType: 'freeze_window',
        targetId: window._id.toString(),
        details: { jurisdictionId: data.jurisdictionId, reason: data.reason },
      });

      res.status(201).json({ success: true, message: 'Freeze window established.', window });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an election freeze window
   */
  static async updateFreezeWindow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const schema = z.object({
        roles: z.array(z.string()).optional(),
        freezeStart: z.string().optional(),
        freezeEnd: z.string().optional(),
        reason: z.string().min(5).optional(),
        isActive: z.boolean().optional(),
      });
      const data = schema.parse(req.body);

      const window = await FreezeWindow.findById(id);
      if (!window) {
        res.status(404).json({ success: false, message: 'Freeze window not found.' });
        return;
      }

      if (data.roles !== undefined) window.roles = data.roles;
      if (data.freezeStart !== undefined) window.freezeStart = new Date(data.freezeStart);
      if (data.freezeEnd !== undefined) window.freezeEnd = new Date(data.freezeEnd);
      if (data.reason !== undefined) window.reason = data.reason;
      if (data.isActive !== undefined) window.isActive = data.isActive;
      await window.save();

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'election_freeze_window_updated',
        targetType: 'freeze_window',
        targetId: window._id.toString(),
      });

      res.json({ success: true, message: 'Freeze window updated.', window });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete an election freeze window
   */
  static async deleteFreezeWindow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const window = await FreezeWindow.findByIdAndDelete(id);
      if (!window) {
        res.status(404).json({ success: false, message: 'Freeze window not found.' });
        return;
      }

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'election_freeze_window_deleted',
        targetType: 'freeze_window',
        targetId: id,
      });

      res.json({ success: true, message: 'Freeze window removed.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin trigger to generate draft monthly reports for a specified target month or previous month
   */
  static async triggerGenerateMonthlyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetMonthDate } = req.body || {};
      const date = targetMonthDate ? new Date(targetMonthDate) : undefined;
      const result = await MonthlyReportService.generateMonthlyReports(date);

      res.json({
        success: true,
        message: `Draft monthly reports generated for period ${result.period}. 5-day right of reply window active.`,
        result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin trigger to publish all due monthly reports
   */
  static async triggerPublishDueReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publishedCount = await MonthlyReportService.publishDueReports();
      res.json({
        success: true,
        message: `Published ${publishedCount} monthly reports whose right-of-reply window has concluded.`,
        publishedCount,
      });
    } catch (err) {
      next(err);
    }
  }
}

