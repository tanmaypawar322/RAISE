import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Office } from '../../models/Office.js';
import { User } from '../../models/User.js';
import { OfficeInvite } from '../../models/OfficeInvite.js';
import { Issue } from '../../models/Issue.js';
import { Jurisdiction } from '../../models/Jurisdiction.js';
import { CorrectionRequest } from '../../models/CorrectionRequest.js';
import { MonthlyReport } from '../../models/MonthlyReport.js';
import { MetricsService } from '../../services/metrics.service.js';
import { AuditService } from '../../services/audit.service.js';

const PublishReportSchema = z.object({
  title: z.string().min(5).max(120),
  period: z.string().min(2).max(50),
  budget: z.string().optional(),
  content: z.string().min(10).max(2500),
});

export class OfficesController {
  static async getOffices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { department, level, claimStatus, search } = req.query;
      const filter: any = {};

      if (department) filter.department = department;
      if (level) filter.level = level;
      if (claimStatus) filter.claimStatus = claimStatus;
      if (search) {
        filter.$or = [
          { name: { $regex: search as string, $options: 'i' } },
          { nameMr: { $regex: search as string, $options: 'i' } },
        ];
      }

      const offices = await Office.find(filter).sort({ 'stats.issuesTotal': -1 }).limit(100);
      res.json({ success: true, offices });
    } catch (err) {
      next(err);
    }
  }

  static async getOfficeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const office = await Office.findById(id).populate('claimedBy', 'name email');

      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found' });
        return;
      }

      // Compute live scorecard metrics from assigned civic issues
      const officeIssues = await Issue.find({ officeId: office._id, status: { $ne: 'draft' } });
      const totalIssues = officeIssues.length;

      const openStatuses = ['submitted', 'published', 'acknowledged', 'in_progress', 'disputed'];
      const openIssues = officeIssues.filter((i) => openStatuses.includes(i.status));
      const openIssuesCount = openIssues.length;

      const now = new Date();
      const overdueIssues = officeIssues.filter((i) => {
        if (!openStatuses.includes(i.status)) return false;
        if (i.escalationLevel && i.escalationLevel > 0) return true;
        const deadline =
          i.slaDeadline ||
          new Date(new Date(i.createdAt).getTime() + (i.slaHours || 48) * 3600 * 1000);
        return deadline < now;
      });
      const overdueCount = overdueIssues.length;

      const ackStatuses = ['acknowledged', 'in_progress', 'resolved_pending_confirmation', 'resolved'];
      const ackIssues = officeIssues.filter((i) => ackStatuses.includes(i.status));
      let ackOnTimeCount = 0;
      for (const issue of ackIssues) {
        const ackEvent = issue.statusTimeline?.find((t: any) => ackStatuses.includes(t.status));
        const ackTime = ackEvent ? new Date(ackEvent.updatedAt) : new Date(issue.updatedAt);
        const deadline =
          issue.slaDeadline ||
          new Date(new Date(issue.createdAt).getTime() + (issue.slaHours || 48) * 3600 * 1000);
        if (ackTime.getTime() <= deadline.getTime()) {
          ackOnTimeCount++;
        }
      }
      const percentAcknowledgedOnTime =
        ackIssues.length > 0
          ? Math.round((ackOnTimeCount / ackIssues.length) * 100)
          : totalIssues > 0
          ? 0
          : 100;

      const resStatuses = ['resolved_pending_confirmation', 'resolved'];
      const resolvedIssues = officeIssues.filter(
        (i) => resStatuses.includes(i.status) || i.resolvedAt
      );
      const resolvedCount = resolvedIssues.length;
      const percentResolved =
        totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

      const resolveDays: number[] = [];
      for (const issue of resolvedIssues) {
        const resTime = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date(issue.updatedAt);
        const createdAt = new Date(issue.createdAt);
        const days = Math.max(0, (resTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        resolveDays.push(days);
      }
      resolveDays.sort((a, b) => a - b);
      const medianResolutionDays =
        resolveDays.length > 0
          ? Math.round(
              (resolveDays.length % 2 !== 0
                ? resolveDays[Math.floor(resolveDays.length / 2)]
                : (resolveDays[resolveDays.length / 2 - 1] +
                    resolveDays[resolveDays.length / 2]) /
                  2) * 10
            ) / 10
          : 0;

      // Compute fair scorecard snapshot via MetricsService
      const metricSnapshot = await MetricsService.computeOfficeMetrics(office._id);

      // Published monthly reports archive
      const reports = await MonthlyReport.find({
        targetType: 'office',
        targetId: office._id,
        status: 'published',
      }).sort({ month: -1 });

      res.json({
        success: true,
        office,
        metricSnapshot,
        reports,
        scorecard: {
          totalIssuesReceived: totalIssues,
          percentAcknowledgedOnTime,
          percentResolved,
          medianResolutionDays,
          openIssuesCount,
          overdueCount,
          isSampleTooSmall: metricSnapshot?.isSampleTooSmall ?? (totalIssues < 10),
          methodology: {
            title: 'How scorecard metrics are calculated',
            explanation:
              'Total Issues Received is all civic grievances assigned to this jurisdiction (excluding issues rerouted within 48h). Sample sizes under 10 display counts only to ensure fair statistical representation.',
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitCorrectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = z
        .object({
          itemOrMetric: z.string().min(2).max(120),
          explanation: z.string().min(10).max(3000),
          contactEmail: z.string().email(),
          evidenceFileIds: z.array(z.string()).default([]),
        })
        .parse(req.body);

      const office = await Office.findById(id);
      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found' });
        return;
      }

      const correction = await CorrectionRequest.create({
        targetType: 'office',
        targetId: office._id,
        itemOrMetric: data.itemOrMetric,
        explanation: data.explanation,
        contactEmail: data.contactEmail,
        evidenceFileIds: data.evidenceFileIds || [],
        status: 'pending',
      });

      await AuditService.log({
        actorId: req.user?.userId || 'anonymous_public',
        actorRole: req.user?.role || 'public',
        action: 'office_correction_requested',
        targetType: 'office',
        targetId: office._id.toString(),
        details: { itemOrMetric: data.itemOrMetric },
      });

      res.status(201).json({
        success: true,
        message: 'Correction request submitted for administrative audit.',
        correction,
      });
    } catch (err) {
      next(err);
    }
  }

  static async suggestOffice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;
      const filter: any = {};

      if (category) {
        const deptMap: Record<string, string> = {
          roads: 'roads',
          water: 'water',
          sanitation: 'sanitation',
          health: 'health',
          education: 'education',
          electricity: 'electricity',
        };
        const dept = deptMap[category as string] || 'general';
        filter.department = dept;
      }

      let office = await Office.findOne(filter);
      if (!office) {
        office = await Office.findOne({ level: 'ward' }) || await Office.findOne();
      }

      res.json({ success: true, suggestedOffice: office });
    } catch (err) {
      next(err);
    }
  }

  static async claimOffice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { officialEmail } = z.object({ officialEmail: z.string().email() }).parse(req.body);

      const office = await Office.findById(id);
      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found' });
        return;
      }

      office.claimStatus = 'pending_verification';
      office.officialEmail = officialEmail;
      if (req.user) {
        office.claimedBy = new mongoose.Types.ObjectId(req.user.userId);
      }
      await office.save();

      res.json({
        success: true,
        message: 'Claim request submitted. Platform Admin review pending.',
        office,
      });
    } catch (err) {
      next(err);
    }
  }

  static async publishReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const data = PublishReportSchema.parse(req.body);

      const office = await Office.findById(id);
      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User account not found.' });
        return;
      }

      if (user.status === 'pending') {
        res.status(403).json({
          success: false,
          message: 'Account pending verification. Privileged actions require approved status.',
        });
        return;
      }

      if (user.role !== 'admin') {
        const hasAccess =
          (user.officeMemberships &&
            user.officeMemberships.some(
              (m) => m.officeId.toString() === office._id.toString() && m.status === 'active'
            )) ||
          (user.officialOfficeId &&
            user.officialOfficeId.toString() === office._id.toString() &&
            user.isOfficialVerified);

        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You can only publish reports for your designated office.',
          });
          return;
        }
      }

      office.reports.push({
        title: data.title,
        period: data.period,
        budget: data.budget,
        content: data.content,
        publishedBy: user._id as mongoose.Types.ObjectId,
        createdAt: new Date(),
      });

      await office.save();

      res.status(201).json({
        success: true,
        message: 'Official report published successfully.',
        reports: office.reports,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Office head issues a signed invitation token for colleagues / contractors (expires 7 days)
   */
  static async createInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const { email, role, memberRole } = req.body;

      const office = await Office.findById(id);
      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found.' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found.' });
        return;
      }

      const isAuthorized =
        user.role === 'admin' ||
        (user.officeMemberships &&
          user.officeMemberships.some(
            (m) =>
              m.officeId.toString() === office._id.toString() &&
              (m.memberRole === 'head' || user.role === 'official') &&
              m.status === 'active'
          ));

      if (!isAuthorized) {
        res.status(403).json({
          success: false,
          message: 'Only verified office authorities or platform administrators can issue invitations.',
        });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invite = await OfficeInvite.create({
        token,
        officeId: office._id,
        invitedBy: user._id,
        email: email ? email.toLowerCase().trim() : undefined,
        role: role === 'agency' ? 'agency' : 'official',
        memberRole: memberRole || (role === 'agency' ? 'contractor' : 'officer'),
        expiresAt,
        used: false,
      });

      res.status(201).json({
        success: true,
        message: 'Invitation generated successfully (valid for 7 days).',
        inviteToken: token,
        expiresAt,
        inviteUrl: `/office-portal?invite=${token}`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const office = await Office.findById(id).select('reports name nameMr');
      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found' });
        return;
      }

      res.json({ success: true, reports: office.reports });
    } catch (err) {
      next(err);
    }
  }

  static async getJurisdictions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { level, type, search } = req.query;
      const filter: any = {};
      if (level) filter.level = level;
      if (type) filter.type = type;
      if (search) {
        filter.$or = [
          { name: { $regex: search as string, $options: 'i' } },
          { nameMr: { $regex: search as string, $options: 'i' } },
          { code: { $regex: search as string, $options: 'i' } },
        ];
      }
      const jurisdictions = await Jurisdiction.find(filter)
        .select('name nameMr nameHi code level type')
        .sort({ level: 1, name: 1 })
        .limit(200);
      res.json({ success: true, jurisdictions });
    } catch (err) {
      next(err);
    }
  }
}
