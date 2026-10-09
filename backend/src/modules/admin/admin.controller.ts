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
import { config } from '../../config/env.js';

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
        .populate('officeId', 'name nameMr department level jurisdiction claimStatus')
        .populate('reviewedBy', 'displayName email')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        claims,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Approve claim: activates user, assigns office membership, and updates office claim status
   */
  static async approveClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
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
      await claim.save();

      // Activate user account and grant office privileges
      const user = await User.findById(claim.userId);
      if (user) {
        user.status = 'active';
        user.isOfficialVerified = true;
        user.role = claim.role;
        user.officialOfficeId = claim.officeId;

        const memberRole = claim.role === 'agency' ? 'contractor' : 'officer';
        const existingIdx = user.officeMemberships.findIndex(
          (m) => m.officeId.toString() === claim.officeId.toString()
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

      // Update office record
      const office = await Office.findById(claim.officeId);
      if (office) {
        office.claimStatus = 'claimed';
        office.claimedBy = claim.userId;
        await office.save();
      }

      console.info(
        `[AUDIT] Admin ${req.user?.email || req.user?.userId} approved claim ${claim._id} for user ${claim.userId} at office ${claim.officeId}`
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
}

