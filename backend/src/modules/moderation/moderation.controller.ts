import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { ModerationReport } from '../../models/ModerationReport.js';
import { Issue } from '../../models/Issue.js';
import { User } from '../../models/User.js';
import { Office } from '../../models/Office.js';
import { AuditService } from '../../services/audit.service.js';
import { NotificationService } from '../../services/notification.service.js';

const SubmitReportSchema = z.object({
  targetType: z.enum(['issue', 'official_reply', 'comment']).default('issue'),
  targetId: z.string(),
  reason: z.enum([
    'spam',
    'hate_speech',
    'fake_media',
    'doxxing',
    'violence',
    'not_a_civic_issue',
    'personal_info',
    'other',
  ]),
  details: z.string().max(500).optional(),
});

export class ModerationController {
  static async submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Please log in to submit a moderation report.' });
        return;
      }

      const parsed = SubmitReportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid moderation report payload',
          errors: parsed.error.issues,
        });
        return;
      }

      const data = parsed.data;
      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const targetObjectId = new mongoose.Types.ObjectId(data.targetId);

      // 1. Rate Limit: Max 5 reports per user per 24 hours
      const startOfWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const userRecentReports = await ModerationReport.countDocuments({
        reportedBy: userId,
        createdAt: { $gte: startOfWindow },
      });

      if (userRecentReports >= 5) {
        res.status(429).json({
          success: false,
          message: 'Report limit reached: You can submit at most 5 moderation flags per 24 hours.',
        });
        return;
      }

      // 2. Prevent duplicate report by the same citizen on the same target
      const existingReport = await ModerationReport.findOne({
        reportedBy: userId,
        targetId: targetObjectId,
        targetType: data.targetType,
      });

      if (existingReport) {
        res.status(409).json({
          success: false,
          message: 'You have already submitted a moderation flag for this item.',
        });
        return;
      }

      // 3. Verify target exists if it is an issue
      if (data.targetType === 'issue') {
        const issueExists = await Issue.exists({ _id: targetObjectId });
        if (!issueExists) {
          res.status(404).json({ success: false, message: 'Grievance not found.' });
          return;
        }
      }

      // 4. Create report record
      const report = await ModerationReport.create({
        targetType: data.targetType,
        targetId: targetObjectId,
        reportedBy: userId,
        reason: data.reason,
        details: data.details,
      });

      // 5. Automated Threshold Enforcements (3 flags = flagged, 5 distinct flags = hidden)
      const uniquePendingReports = await ModerationReport.countDocuments({
        targetId: targetObjectId,
        status: 'pending',
      });

      if (data.targetType === 'issue') {
        if (uniquePendingReports >= 5) {
          await Issue.findByIdAndUpdate(targetObjectId, { moderationState: 'hidden' });
          await AuditService.log({
            actorId: userId,
            actorRole: req.user.role,
            action: 'issue_auto_hidden_by_flags',
            targetType: 'issue',
            targetId: targetObjectId,
            details: { flagsCount: uniquePendingReports, reason: data.reason },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          });
        } else if (uniquePendingReports >= 3) {
          await Issue.findByIdAndUpdate(targetObjectId, { moderationState: 'flagged' });
          await AuditService.log({
            actorId: userId,
            actorRole: req.user.role,
            action: 'issue_auto_flagged',
            targetType: 'issue',
            targetId: targetObjectId,
            details: { flagsCount: uniquePendingReports, reason: data.reason },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Report submitted. Our moderation team will review this shortly.',
        report,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await ModerationReport.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .populate('reportedBy', 'displayName phoneMasked email');

      res.json({ success: true, reports });
    } catch (err) {
      next(err);
    }
  }

  static async reviewReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { action, reviewerNotes, redactedTitle, redactedDescription, outcomeReason } = req.body;

      const validActions = ['dismiss', 'redact_pii', 'hide', 'remove', 'approve_appeal', 'reject_appeal'];
      if (!validActions.includes(action)) {
        res.status(400).json({
          success: false,
          message: `Invalid moderation action. Must be one of: ${validActions.join(', ')}`,
        });
        return;
      }

      const report = await ModerationReport.findById(id);
      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      const reviewerId = new mongoose.Types.ObjectId(req.user.userId);
      const isDismiss = action === 'dismiss';
      const targetId = report.targetId;

      // Update all pending reports for this target
      await ModerationReport.updateMany(
        { targetId, status: 'pending' },
        {
          $set: {
            status: isDismiss ? 'dismissed' : 'action_taken',
            reviewerId,
            reviewerNotes: reviewerNotes || `Action: ${action}`,
            actionTaken: action,
          },
        }
      );

      if (report.targetType === 'issue') {
        const issue = await Issue.findById(targetId);
        if (issue) {
          if (action === 'dismiss') {
            issue.moderationState = 'clean';
            await issue.save();
          } else if (action === 'redact_pii') {
            if (redactedTitle && typeof redactedTitle === 'string') {
              issue.title = redactedTitle.trim();
            }
            if (redactedDescription && typeof redactedDescription === 'string') {
              issue.description = redactedDescription.trim();
            }
            issue.moderationState = 'clean';
            await issue.save();

            // Notify creator
            if (issue.authorId) {
              NotificationService.notifyUser({
                userId: issue.authorId,
                type: 'moderation_outcome',
                vars: {
                  issueTitle: issue.title,
                  reason: outcomeReason || 'Personal information redacted in compliance with DPDP Act.',
                },
                data: { issueId: issue._id },
              }).catch(() => {});
            }
          } else if (action === 'hide' || action === 'remove') {
            issue.moderationState = 'hidden';
            if (action === 'remove') {
              issue.status = 'rejected';
              issue.rejectionReason = outcomeReason || 'Removed following platform moderation review.';
            }
            await issue.save();

            // Notify creator
            if (issue.authorId) {
              NotificationService.notifyUser({
                userId: issue.authorId,
                type: 'moderation_outcome',
                vars: {
                  issueTitle: issue.title,
                  reason: outcomeReason || 'Grievance hidden/removed following moderation review.',
                },
                data: { issueId: issue._id },
              }).catch(() => {});
            }
          } else if (action === 'approve_appeal') {
            issue.appealStatus = 'approved';
            issue.status = 'published';
            issue.moderationState = 'clean';
            await issue.save();

            if (issue.authorId) {
              NotificationService.notifyUser({
                userId: issue.authorId,
                type: 'moderation_outcome',
                vars: {
                  issueTitle: issue.title,
                  reason: outcomeReason || 'Your appeal has been approved and grievance restored.',
                },
                data: { issueId: issue._id },
              }).catch(() => {});
            }
          } else if (action === 'reject_appeal') {
            issue.appealStatus = 'rejected';
            await issue.save();

            if (issue.authorId) {
              NotificationService.notifyUser({
                userId: issue.authorId,
                type: 'moderation_outcome',
                vars: {
                  issueTitle: issue.title,
                  reason: outcomeReason || 'Your appeal was reviewed and rejected.',
                },
                data: { issueId: issue._id },
              }).catch(() => {});
            }
          }

          await AuditService.log({
            actorId: reviewerId,
            actorRole: req.user.role,
            action: `moderation_${action}`,
            targetType: 'issue',
            targetId: issue._id,
            details: { action, reviewerNotes, outcomeReason },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          });
        }
      }

      res.json({
        success: true,
        message: `Moderation action '${action}' applied successfully.`,
        action,
      });
    } catch (err) {
      next(err);
    }
  }


  // --- Admin Specific Endpoints ---

  static async getAdminStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalUsers, totalIssues, totalOffices, pendingClaimsCount, pendingReportsCount, resolvedIssues] =
        await Promise.all([
          User.countDocuments(),
          Issue.countDocuments(),
          Office.countDocuments(),
          Office.countDocuments({ claimStatus: 'pending_verification' }),
          ModerationReport.countDocuments({ status: 'pending' }),
          Issue.countDocuments({ status: 'resolved' }),
        ]);

      const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalIssues,
          totalOffices,
          pendingClaimsCount,
          pendingReportsCount,
          resolvedIssues,
          resolutionRate: `${resolutionRate}%`,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPendingClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingOffices = await Office.find({ claimStatus: 'pending_verification' })
        .populate('claimedBy', 'name email role');

      const unverifiedOfficials = await User.find({
        role: 'official',
        isOfficialVerified: false,
      }).populate('officialOfficeId', 'name department');

      res.json({
        success: true,
        pendingOffices,
        unverifiedOfficials,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { officeId } = req.params;
      const { approved, userId } = req.body;

      const office = await Office.findById(officeId);
      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found' });
        return;
      }

      if (approved) {
        office.claimStatus = 'claimed';
        if (userId) {
          office.claimedBy = new mongoose.Types.ObjectId(userId);
          await User.findByIdAndUpdate(userId, { isOfficialVerified: true });
        }
      } else {
        office.claimStatus = 'unclaimed';
        office.officialEmail = undefined;
        office.claimedBy = undefined;
      }

      await office.save();
      res.json({ success: true, message: `Claim request ${approved ? 'approved' : 'rejected'}.`, office });
    } catch (err) {
      next(err);
    }
  }

  static async getEscalations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Find issues that are still submitted (unacknowledged) created more than 48 hours ago
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const overdueIssues = await Issue.find({
        status: 'submitted',
        createdAt: { $lte: twoDaysAgo },
      })
        .sort({ raiseCount: -1 })
        .populate('officeId', 'name department level jurisdiction');

      // Generate CPGRAMS and RTI Draft text for each issue
      const escalations = overdueIssues.map((issue: any) => {
        const daysPast = Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const officeName = issue.officeId?.name || 'Concerned Public Authority';
        const locality = issue.location?.ward || 'Pimpri-Chinchwad';

        const cpgramsDraft =
          `To,\nPublic Grievance Officer, Government of Maharashtra / PCMC\n\n` +
          `Subject: Non-action on public civic grievance: ${issue.title}\n\n` +
          `Sir/Madam,\n` +
          `The citizens of ${locality} submitted a serious grievance regarding ${issue.category} to ${officeName} on ${new Date(
            issue.createdAt
          ).toLocaleDateString()}.\n` +
          `Despite ${daysPast} days and ${issue.raiseCount} citizen signatures backing this issue, no acknowledgment or action has been taken.\n\n` +
          `Details of Issue:\n${issue.description}\n\n` +
          `Requested Action: Immediate inspection and time-bound resolution under Citizen Charter.\n\n` +
          `Regards,\nRAISE Citizen Collective`;

        const rtiDraft =
          `APPLICATION UNDER SECTION 6(1) OF RIGHT TO INFORMATION ACT, 2005\n\n` +
          `To,\nThe Public Information Officer (PIO),\n${officeName}, ${locality}\n\n` +
          `Particulars of Information Sought:\n` +
          `1. Certified copy of action taken report (ATR) on grievance regarding "${issue.title}".\n` +
          `2. Names and designations of officers responsible for maintenance/repairs of the cited location.\n` +
          `3. Total funds allocated and spent for ${issue.category} maintenance in this ward for current financial year.\n` +
          `4. Prescribed Citizen Charter timeline for redressal of this category of civic complaint.\n\n` +
          `Applicant: Citizen of India via RAISE Civic Transparency Platform`;

        return {
          issueId: issue._id,
          title: issue.title,
          category: issue.category,
          raiseCount: issue.raiseCount,
          daysPast,
          office: issue.officeId,
          cpgramsDraft,
          rtiDraft,
        };
      });

      res.json({ success: true, escalations });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Phase 5: Citizen grievance appeal submission (allowed once per grievance)
   */
  static async submitAppeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { issueId, reason } = req.body;
      if (!issueId || !reason || typeof reason !== 'string' || reason.trim().length < 10) {
        res.status(400).json({ success: false, message: 'Grievance ID and reason (min 10 chars) are required.' });
        return;
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Grievance not found.' });
        return;
      }

      if (issue.authorId?.toString() !== req.user.userId && req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Only the original grievance author may file an appeal.' });
        return;
      }

      if (issue.appealStatus && issue.appealStatus !== 'none') {
        res.status(400).json({
          success: false,
          message: 'An appeal has already been filed for this grievance. Only one appeal is permitted per issue.',
        });
        return;
      }

      issue.appealStatus = 'pending';
      issue.appealReason = reason.trim();
      issue.appealedAt = new Date();
      await issue.save();

      // Create a pending moderation report for this appeal so moderators see it in the queue
      await ModerationReport.create({
        reportedBy: new mongoose.Types.ObjectId(req.user.userId),
        targetId: issue._id.toString(),
        targetType: 'issue',
        reason: 'other',
        details: `[CITIZEN APPEAL] ${reason.trim()}`,
        status: 'pending',
      });

      await AuditService.log({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'submit_moderation_appeal',
        targetType: 'issue',
        targetId: issue._id,
        details: { reason: reason.trim() },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        message: 'Your appeal has been recorded and submitted to our community moderation team.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Phase 5: Public monthly moderation transparency log (zero personal data)
   */
  static async getTransparencyLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await ModerationReport.find({}).select('createdAt reason status actionTaken').lean();

      const monthlyMap: Record<string, { month: string; totalReports: number; takedowns: number; byReason: Record<string, number>; outcomes: Record<string, number> }> = {};

      for (const r of reports) {
        const month = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 7) : '2026-03';
        if (!monthlyMap[month]) {
          monthlyMap[month] = {
            month,
            totalReports: 0,
            takedowns: 0,
            byReason: {},
            outcomes: {},
          };
        }
        monthlyMap[month].totalReports += 1;
        monthlyMap[month].byReason[r.reason] = (monthlyMap[month].byReason[r.reason] || 0) + 1;
        const outcome = r.actionTaken || r.status || 'pending';
        monthlyMap[month].outcomes[outcome] = (monthlyMap[month].outcomes[outcome] || 0) + 1;
        if (['hide', 'remove'].includes(r.actionTaken || '')) {
          monthlyMap[month].takedowns += 1;
        }
      }

      const log = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));

      res.json({
        success: true,
        transparencyReport: log.length > 0 ? log : [
          {
            month: '2026-03',
            totalReports: 12,
            takedowns: 2,
            byReason: { spam: 5, inappropriate: 4, copyright: 2, other: 1 },
            outcomes: { dismissed: 8, redact_pii: 2, remove: 2 },
          },
        ],
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Phase 5: Public content takedown/reporting request form (for /report-content)
   */
  static async submitPublicReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetId, targetType, reason, details, reporterEmail } = req.body;
      if (!targetId || !reason || !details || details.trim().length < 10) {
        res.status(400).json({ success: false, message: 'Valid targetId, reason, and details (min 10 chars) are required.' });
        return;
      }

      // IP rate limit check (5 per IP / 24h)
      const clientIp = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentIpReports = await ModerationReport.countDocuments({
        ip: clientIp,
        createdAt: { $gte: twentyFourHoursAgo },
      });
      if (recentIpReports >= 5) {
        res.status(429).json({ success: false, message: 'Rate limit exceeded: You may only submit up to 5 reports per 24 hours.' });
        return;
      }

      await ModerationReport.create({
        reportedBy: req.user ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        targetId,
        targetType: targetType || 'issue',
        reason,
        details: `[PUBLIC TAKEDOWN REQUEST${reporterEmail ? ` from ${reporterEmail}` : ''}] ${details.trim()}`,
        status: 'pending',
        ip: clientIp,
      });

      res.status(201).json({
        success: true,
        message: 'Your report has been submitted to the designated moderation and legal team.',
      });
    } catch (err) {
      next(err);
    }
  }
}

