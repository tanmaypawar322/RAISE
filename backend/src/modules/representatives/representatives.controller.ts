import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { RepresentativeProfile } from '../../models/RepresentativeProfile.js';
import { Jurisdiction } from '../../models/Jurisdiction.js';
import { Office } from '../../models/Office.js';
import { User } from '../../models/User.js';
import { Issue } from '../../models/Issue.js';
import { RepresentativeAsk } from '../../models/RepresentativeAsk.js';
import { RepresentativeUpdate } from '../../models/RepresentativeUpdate.js';
import { MonthlyReport } from '../../models/MonthlyReport.js';
import { OfficeInvite } from '../../models/OfficeInvite.js';
import { CorrectionRequest } from '../../models/CorrectionRequest.js';
import { AuditService } from '../../services/audit.service.js';
import { NotificationService } from '../../services/notification.service.js';
import { MetricsService } from '../../services/metrics.service.js';
import { FreezeService } from '../../services/freeze.service.js';
import crypto from 'crypto';

export const CorrectionRequestSchema = z.object({
  itemOrMetric: z.string().min(2).max(120),
  explanation: z.string().min(10).max(3000),
  contactEmail: z.string().email(),
  evidenceFileIds: z.array(z.string()).default([]),
});

const InviteStaffSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  role: z.enum(['staff', 'officer']).default('staff'),
});

const TakeUpSchema = z.object({
  note: z.string().max(1000).optional(),
});

const RepNoteSchema = z.object({
  note: z.string().min(5).max(1000),
});

const RepUpdateSchema = z.object({
  title: z.string().min(5).max(140),
  body: z.string().min(10).max(2500),
  category: z.string().default('general'),
  photos: z.array(z.string()).max(4).default([]),
  externalUrl: z.string().url().or(z.literal('')).optional(),
});

const ReportReplySchema = z.object({
  replyText: z.string().min(5).max(2000),
});

// Campaign pre-screening banned keywords (en, mr, hi)
const BANNED_CAMPAIGN_TERMS = [
  'vote for',
  'vote me',
  'elect me',
  're-elect',
  'election',
  'candidate',
  'ballot',
  'voting',
  'party',
  'मते द्या',
  'मतदान करा',
  'निवडून द्या',
  'उमेदवार',
  'पार्टी',
  'वोट दें',
  'मत दें',
  'चुनाव',
  'प्रत्याशी',
  'पार्टी',
];

export class RepresentativesController {
  /**
   * Helper to retrieve representative profile associated with the authenticated official
   */
  private static async getRepresentativeForUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) return null;

    // Check office memberships for representative_office
    const repOfficeIds = user.officeMemberships
      .filter((m) => m.status === 'active')
      .map((m) => m.officeId);

    const repOffice = await Office.findOne({
      _id: { $in: repOfficeIds },
      kind: 'representative_office',
    });

    if (!repOffice) return null;

    const profile = await RepresentativeProfile.findOne({
      officeId: repOffice._id,
      status: { $in: ['verified', 'term_ended', 'pending'] },
    }).populate('jurisdictionId');

    const membership = user.officeMemberships.find(
      (m) => m.officeId.toString() === repOffice._id.toString()
    );

    const isOfficeAdmin = membership?.memberRole === 'office_admin' || membership?.memberRole === 'head';

    return { user, profile, office: repOffice, isOfficeAdmin };
  }

  /**
   * Representative workspace overview
   */
  static async getWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const repContext = await RepresentativesController.getRepresentativeForUser(req.user!.userId);
      if (!repContext || !repContext.profile) {
        res.status(403).json({
          success: false,
          message: 'Access restricted to verified representative office accounts.',
        });
        return;
      }

      const { profile, office, isOfficeAdmin } = repContext;

      // 1. Citizen Asks
      const asks = await RepresentativeAsk.find({
        representativeProfileId: profile._id,
      })
        .populate('issueId', 'title category status location raiseCount createdAt')
        .sort({ createdAt: -1 })
        .limit(50);

      const pendingAsksCount = asks.filter((a) => a.status === 'pending').length;

      // 2. Taken Up Grievances
      const takenUpIssues = await Issue.find({
        takenUpByRepIds: profile._id,
      })
        .populate('officeId', 'name department level')
        .sort({ updatedAt: -1 })
        .limit(50);

      const resolvedTakenUpCount = takenUpIssues.filter((i) => i.status === 'resolved').length;
      const citizenConfirmedCount = takenUpIssues.filter(
        (i) => i.confirmationStatus === 'resolved_confirmed'
      ).length;

      // 3. Self-Reported Updates
      const updates = await RepresentativeUpdate.find({
        representativeProfileId: profile._id,
      }).sort({ createdAt: -1 });

      // 4. Monthly Reports
      const monthlyReports = await MonthlyReport.find({
        targetType: 'representative',
        targetId: profile._id,
      }).sort({ period: -1 });

      // 5. Office Staff Members
      const staffMembers = await User.find({
        'officeMemberships.officeId': office._id,
      }).select('displayName name email role status officeMemberships createdAt');

      res.json({
        success: true,
        profile,
        office,
        isOfficeAdmin,
        metrics: {
          pendingAsksCount,
          totalAsksCount: asks.length,
          takenUpCount: takenUpIssues.length,
          resolvedTakenUpCount,
          citizenConfirmedCount,
          updatesCount: updates.length,
          reportsCount: monthlyReports.length,
        },
        asks,
        takenUpIssues,
        updates,
        monthlyReports,
        staffMembers,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Invite staff member to representative office (Only office_admin)
   */
  static async inviteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const repContext = await RepresentativesController.getRepresentativeForUser(req.user!.userId);
      if (!repContext || !repContext.isOfficeAdmin || !repContext.profile) {
        res.status(403).json({
          success: false,
          message: 'Only representative office administrators can invite staff.',
        });
        return;
      }

      const { name, email, role } = InviteStaffSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase().trim();

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invite = await OfficeInvite.create({
        officeId: repContext.office._id,
        email: normalizedEmail,
        role: 'official',
        invitedBy: new mongoose.Types.ObjectId(req.user!.userId),
        token,
        status: 'pending',
        expiresAt,
      });

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'representative_staff_invited',
        targetType: 'office',
        targetId: repContext.office._id.toString(),
        details: { email: normalizedEmail, role, representativeProfileId: repContext.profile._id.toString() },
      });

      res.status(201).json({
        success: true,
        message: 'Staff member invited successfully.',
        invite: {
          id: invite._id,
          email: invite.email,
          token: invite.token,
          expiresAt: invite.expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * "Who represents this place": panel on issue page
   */
  static async getRepresentativesForIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { issueId } = req.params;
      const issue = await Issue.findById(issueId).populate('officeId');

      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found.' });
        return;
      }

      let jIds = issue.jurisdictionIds || [];
      if (jIds.length === 0) {
        if (issue.location?.coordinates && issue.location.coordinates.length === 2) {
          const containing = await Jurisdiction.find({
            boundary: {
              $geoIntersects: {
                $geometry: {
                  type: 'Point',
                  coordinates: issue.location.coordinates,
                },
              },
            },
          }).select('_id');
          jIds = containing.map((j) => j._id);
        } else if (issue.location?.ward) {
          const matching = await Jurisdiction.find({
            name: new RegExp(issue.location.ward, 'i'),
          }).select('_id');
          jIds = matching.map((j) => j._id);
        }
      }

      // Find representatives covering any containing jurisdiction
      const representatives = await RepresentativeProfile.find({
        jurisdictionId: { $in: jIds },
        status: { $in: ['verified', 'unclaimed'] },
      }).populate('jurisdictionId');

      // Check current citizen's asks if authenticated
      let citizenAsks: any[] = [];
      let canTakeUp = false;
      let userRepProfileId: string | null = null;
      let alreadyTakenUpByUserRep = false;
      let hasThanked = false;

      if (req.user?.userId) {
        citizenAsks = await RepresentativeAsk.find({
          issueId: issue._id,
          userId: req.user.userId,
        });

        if (issue.thankedUserIds && issue.thankedUserIds.some((id: any) => id.toString() === req.user!.userId)) {
          hasThanked = true;
        }

        const repContext = await RepresentativesController.getRepresentativeForUser(req.user.userId);
        if (repContext && repContext.profile) {
          const repProfile = repContext.profile;
          userRepProfileId = repProfile._id.toString();
          const repJurisdictionId = (repProfile.jurisdictionId as any)?._id || repProfile.jurisdictionId;
          const isCovering = jIds.some((id: any) => id.toString() === repJurisdictionId?.toString());
          if (isCovering || repContext.user.role === 'admin') {
            canTakeUp = true;
          }
          if (issue.takenUpByRepIds && issue.takenUpByRepIds.some((id: any) => id.toString() === repProfile._id.toString())) {
            alreadyTakenUpByUserRep = true;
          }
        }
      }

      // Public ask counts by role
      const askCountsRaw = await RepresentativeAsk.aggregate([
        { $match: { issueId: issue._id } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]);
      const askCounts: Record<string, number> = {};
      for (const a of askCountsRaw) {
        askCounts[a._id] = a.count;
      }

      // Check freeze for each representative
      const enrichedReps = await Promise.all(
        representatives.map(async (r) => {
          const rJurId = (r.jurisdictionId as any)?._id || r.jurisdictionId;
          const freezeCheck = await FreezeService.isElectionFreezeActive(rJurId, r.role);
          return {
            ...r.toObject(),
            isElectionFrozen: freezeCheck.isFrozen,
            freezeEnd: freezeCheck.freezeWindow?.freezeEnd,
          };
        })
      );

      res.json({
        success: true,
        owningOffice: issue.officeId,
        representatives: enrichedReps,
        citizenAsks,
        askCounts,
        takenUpByRepIds: issue.takenUpByRepIds || [],
        thanksCount: issue.thanksCount || 0,
        hasThanked,
        canTakeUp,
        userRepProfileId,
        alreadyTakenUpByUserRep,
        repActionHistory: issue.repActionHistory || [],
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Citizen asks representative to look into issue (Rate limit: MAX_ASKS_PER_USER_PER_DAY = 5, 1 per role)
   */
  static async askRepresentative(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { issueId, repId } = req.params;
      const userId = req.user!.userId;

      // Rate limit check: max 5 asks per user in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAsksCount = await RepresentativeAsk.countDocuments({
        userId,
        createdAt: { $gte: oneDayAgo },
      });

      const maxAsksPerDay = 5;
      if (recentAsksCount >= maxAsksPerDay) {
        res.status(429).json({
          success: false,
          message: `Daily limit reached. You can submit up to ${maxAsksPerDay} asks per day.`,
        });
        return;
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found.' });
        return;
      }

      const rep = await RepresentativeProfile.findById(repId);
      if (!rep) {
        res.status(404).json({ success: false, message: 'Representative not found.' });
        return;
      }

      // Freeze check (Election Model Code of Conduct)
      const repJurId = (rep.jurisdictionId as any)?._id || rep.jurisdictionId;
      const freezeCheck = await FreezeService.isElectionFreezeActive(repJurId, rep.role);
      if (freezeCheck.isFrozen) {
        res.status(403).json({
          success: false,
          message: 'Paused during election model code of conduct.',
        });
        return;
      }

      // Check if user already asked for this representative role on this issue
      const existingAsk = await RepresentativeAsk.findOne({
        issueId: issue._id,
        userId,
        role: rep.role,
      });

      if (existingAsk) {
        res.status(409).json({
          success: false,
          message: `You have already asked a ${rep.role.toUpperCase()} to look into this issue.`,
        });
        return;
      }

      const slaHours = 72; // REP_ASK_SLA_HOURS default
      const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

      const ask = await RepresentativeAsk.create({
        issueId: issue._id,
        representativeProfileId: rep._id,
        officeId: rep.officeId,
        userId,
        role: rep.role,
        status: 'pending',
        slaDeadline,
      });

      // Notify representative office
      if (rep.officeId) {
        NotificationService.notifyOfficeMembers(
          rep.officeId,
          'issue_escalated',
          { issueTitle: issue.title, officeName: rep.displayName },
          { issueId: issue._id }
        ).catch((err) => console.warn('[RepAsk] Notification error:', err.message));
      }

      await AuditService.log({
        actorId: userId,
        actorRole: req.user?.role,
        action: 'representative_asked',
        targetType: 'issue',
        targetId: issue._id.toString(),
        details: { representativeProfileId: rep._id.toString(), role: rep.role },
      });

      res.status(201).json({
        success: true,
        message: 'Your request has been forwarded to the representative office.',
        ask,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'You have already submitted an ask for this role on this issue.',
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Representative takes up an issue
   */
  static async takeUpIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { issueId } = req.params;
      const { note } = TakeUpSchema.parse(req.body);

      const repContext = await RepresentativesController.getRepresentativeForUser(req.user!.userId);
      if (!repContext || !repContext.profile) {
        res.status(403).json({
          success: false,
          message: 'Only verified representative office accounts can take up issues.',
        });
        return;
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found.' });
        return;
      }

      const repId = repContext.profile._id;
      const alreadyTakenUp = issue.takenUpByRepIds.some((id) => id.toString() === repId.toString());

      if (!alreadyTakenUp) {
        issue.takenUpByRepIds.push(repId);
      }

      issue.repActionHistory.push({
        repId,
        action: 'taken_up',
        note: note || `Taken up by ${repContext.profile.displayName} (${repContext.profile.role.toUpperCase()})`,
        timestamp: new Date(),
      });

      issue.statusTimeline.push({
        status: issue.status,
        note: `Taken up by elected representative ${repContext.profile.displayName} (${repContext.profile.role.toUpperCase()}).`,
        updatedAt: new Date(),
      });

      await issue.save();

      // Mark citizen asks for this rep on this issue as 'taken_up'
      await RepresentativeAsk.updateMany(
        { issueId: issue._id, representativeProfileId: repId, status: 'pending' },
        { status: 'taken_up', takenUpAt: new Date() }
      );

      // Audit log
      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'issue_taken_up_by_representative',
        targetType: 'issue',
        targetId: issue._id.toString(),
        details: { representativeProfileId: repId.toString(), note },
      });

      res.json({
        success: true,
        message: 'Issue taken up successfully. Status update visible to citizens.',
        issue,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Representative sends an inquiry / update requested note to owning department
   */
  static async postInquiryNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { issueId } = req.params;
      const { note } = RepNoteSchema.parse(req.body);

      const repContext = await RepresentativesController.getRepresentativeForUser(req.user!.userId);
      if (!repContext || !repContext.profile) {
        res.status(403).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found.' });
        return;
      }

      issue.repActionHistory.push({
        repId: repContext.profile._id,
        action: 'inquiry_to_department',
        note,
        timestamp: new Date(),
      });

      issue.statusTimeline.push({
        status: issue.status,
        note: `Update requested from department by ${repContext.profile.displayName}: "${note}"`,
        updatedAt: new Date(),
      });

      await issue.save();

      // Notify owning office
      if (issue.officeId) {
        NotificationService.notifyOfficeMembers(
          issue.officeId,
          'office_escalation_received',
          { issueTitle: issue.title },
          { issueId: issue._id }
        ).catch(() => {});
      }

      res.json({ success: true, message: 'Inquiry note transmitted to department.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Citizen "Thank you" action on resolved issues
   */
  static async thankRepresentative(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { issueId } = req.params;
      const userId = req.user!.userId;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found.' });
        return;
      }

      if (issue.status !== 'resolved') {
        res.status(400).json({ success: false, message: 'Thanks can only be submitted for resolved grievances.' });
        return;
      }

      const alreadyThanked = issue.thankedUserIds.some((id) => id.toString() === userId.toString());
      if (alreadyThanked) {
        res.status(409).json({ success: false, message: 'You have already thanked the representative for this resolution.' });
        return;
      }

      issue.thankedUserIds.push(new mongoose.Types.ObjectId(userId));
      issue.thanksCount = (issue.thanksCount || 0) + 1;
      await issue.save();

      await AuditService.log({
        actorId: userId,
        actorRole: req.user?.role,
        action: 'citizen_thanked_representative',
        targetType: 'issue',
        targetId: issue._id.toString(),
      });

      res.json({
        success: true,
        message: 'Thank you registered publicly.',
        thanksCount: issue.thanksCount,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Submit self-reported update (Pre-moderated, non-campaigning enforced)
   */
  static async createUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const repContext = await RepresentativesController.getRepresentativeForUser(req.user!.userId);
      if (!repContext || !repContext.profile) {
        res.status(403).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      // Election freeze check (Model Code of Conduct)
      if (repContext.profile.jurisdictionId) {
        const freeze = await FreezeService.isElectionFreezeActive(
          repContext.profile.jurisdictionId as any,
          repContext.profile.role
        );
        if (freeze.isFrozen) {
          res.status(403).json({
            success: false,
            message: 'Model Code of Conduct in effect: representative activity is paused in this jurisdiction during elections.',
            freezeWindow: freeze.freezeWindow,
          });
          return;
        }
      }

      const data = RepUpdateSchema.parse(req.body);
      const combinedText = `${data.title} ${data.body}`.toLowerCase();

      // Pre-screening check against campaigning terms
      const campaignTrigger = BANNED_CAMPAIGN_TERMS.find((term) => combinedText.includes(term));

      // Auto-hold for admin moderation if campaign keyword detected
      const status = campaignTrigger ? 'pending_moderation' : 'pending_moderation'; // All pre-moderated in v1 as per Rule 6
      const moderationReason = campaignTrigger ? `Contains potential campaigning keyword: "${campaignTrigger}"` : undefined;

      const update = await RepresentativeUpdate.create({
        representativeProfileId: repContext.profile._id,
        officeId: repContext.office._id,
        authorId: new mongoose.Types.ObjectId(req.user!.userId),
        title: data.title,
        body: data.body,
        category: data.category,
        jurisdictionId: repContext.profile.jurisdictionId,
        photos: data.photos,
        externalUrl: data.externalUrl,
        status,
        moderationReason,
        isSelfReported: true,
      });

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'representative_update_submitted',
        targetType: 'representative_update',
        targetId: update._id.toString(),
        details: { status, moderationReason },
      });

      res.status(201).json({
        success: true,
        message: 'Self-reported update submitted for moderation review.',
        update,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Citizen cross-check: Confirm self-reported update
   */
  static async confirmUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const update = await RepresentativeUpdate.findById(id);
      if (!update || update.status !== 'published') {
        res.status(404).json({ success: false, message: 'Published update not found.' });
        return;
      }

      const alreadyConfirmed = update.confirmedUserIds.some((u) => u.toString() === userId.toString());
      if (alreadyConfirmed) {
        res.status(409).json({ success: false, message: 'You have already confirmed this work update.' });
        return;
      }

      // Remove from disputed if previously disputed
      update.disputedUserIds = update.disputedUserIds.filter((u) => u.toString() !== userId.toString());
      update.disputeReasons = update.disputeReasons.filter((d) => d.userId.toString() !== userId.toString());
      update.disputedCount = update.disputedUserIds.length;

      update.confirmedUserIds.push(new mongoose.Types.ObjectId(userId));
      update.confirmedCount = update.confirmedUserIds.length;
      await update.save();

      res.json({ success: true, confirmedCount: update.confirmedCount, disputedCount: update.disputedCount });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Citizen cross-check: Dispute self-reported update
   */
  static async disputeUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = z.object({ reason: z.string().min(20, 'Dispute reason must be at least 20 characters').max(500) }).parse(req.body);
      const userId = req.user!.userId;

      const update = await RepresentativeUpdate.findById(id);
      if (!update || update.status !== 'published') {
        res.status(404).json({ success: false, message: 'Published update not found.' });
        return;
      }

      const alreadyDisputed = update.disputedUserIds.some((u) => u.toString() === userId.toString());
      if (alreadyDisputed) {
        res.status(409).json({ success: false, message: 'You have already disputed this work update.' });
        return;
      }

      // Remove from confirmed if previously confirmed
      update.confirmedUserIds = update.confirmedUserIds.filter((u) => u.toString() !== userId.toString());
      update.confirmedCount = update.confirmedUserIds.length;

      update.disputedUserIds.push(new mongoose.Types.ObjectId(userId));
      update.disputeReasons.push({
        userId: new mongoose.Types.ObjectId(userId),
        reason,
        createdAt: new Date(),
      });
      update.disputedCount = update.disputedUserIds.length;

      // Threshold check: >30% dispute ratio with at least 10 responses marks as under community review
      const totalResponses = update.confirmedCount + update.disputedCount;
      if (totalResponses >= 10 && (update.disputedCount / totalResponses) > 0.3) {
        update.isUnderCommunityReview = true;
      }

      await update.save();

      res.json({
        success: true,
        confirmedCount: update.confirmedCount,
        disputedCount: update.disputedCount,
        isUnderCommunityReview: update.isUnderCommunityReview,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Representative formal right-of-reply on draft monthly report (5-day window)
   */
  static async submitReportReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { replyText } = ReportReplySchema.parse(req.body);

      const repContext = await RepresentativesController.getRepresentativeForUser(req.user!.userId);
      if (!repContext || !repContext.profile) {
        res.status(403).json({ success: false, message: 'Unauthorized.' });
        return;
      }

      const report = await MonthlyReport.findById(id);
      if (!report || report.targetId.toString() !== repContext.profile._id.toString()) {
        res.status(404).json({ success: false, message: 'Monthly report not found.' });
        return;
      }

      if (report.status === 'published') {
        res.status(400).json({ success: false, message: 'Report is already published. Submit a correction request instead.' });
        return;
      }

      if (new Date() > report.replyDeadline) {
        res.status(400).json({ success: false, message: '5-day right of reply window has expired.' });
        return;
      }

      report.replyText = replyText;
      report.replySubmittedAt = new Date();
      report.replySubmittedBy = new mongoose.Types.ObjectId(req.user!.userId);
      await report.save();

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'monthly_report_reply_submitted',
        targetType: 'monthly_report',
        targetId: report._id.toString(),
      });

      res.json({ success: true, message: 'Formal reply saved. It will appear alongside published metrics.', report });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public Record Page for an elected representative (/representatives/[id])
   */
  static async getRepresentativePublicRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rep = await RepresentativeProfile.findById(id).populate('jurisdictionId');
      if (!rep) {
        res.status(404).json({ success: false, message: 'Representative profile not found.' });
        return;
      }

      // Safe public profile fields (Strict Rule 1 & 4: Zero party branding, zero personal email/phone)
      const publicProfile = {
        _id: rep._id,
        displayName: rep.displayName,
        role: rep.role,
        titleText: rep.titleText,
        jurisdiction: rep.jurisdictionId,
        termStart: rep.termStart,
        termEnd: rep.termEnd,
        status: rep.status,
        photoUrl: rep.photoUrl,
        officialSiteUrl: rep.officialSiteUrl,
        isClaimed: rep.status === 'verified' || rep.status === 'term_ended',
      };

      const jurisdictionId = (rep.jurisdictionId as any)?._id || rep.jurisdictionId;
      const electionFreeze = await FreezeService.isElectionFreezeActive(jurisdictionId, rep.role);

      if (rep.status === 'unclaimed') {
        // Unclaimed: Counts only, never scores or percentages
        const openIssuesCount = await Issue.countDocuments({
          jurisdictionIds: jurisdictionId,
          status: { $in: ['submitted', 'published', 'acknowledged', 'in_progress', 'disputed'] },
        });

        res.json({
          success: true,
          profile: publicProfile,
          openIssuesCount,
          isClaimed: false,
          electionFreeze,
        });
        return;
      }

      // Claimed/Verified or Term Ended: Compute fair scorecard
      const metricSnapshot = await MetricsService.computeRepresentativeMetrics(rep._id);

      // Issues taken up by this representative
      const issuesTakenUp = await Issue.find({
        takenUpByRepIds: rep._id,
        status: { $ne: 'draft' },
      })
        .select('title category status confirmedByCount thanksCount createdAt')
        .sort({ createdAt: -1 })
        .limit(50);

      // Self-reported updates (Pre-moderated, only published ones shown)
      const updates = await RepresentativeUpdate.find({
        representativeProfileId: rep._id,
        status: 'published',
      }).sort({ createdAt: -1 });

      // Published monthly reports archive
      const reports = await MonthlyReport.find({
        targetType: 'representative',
        targetId: rep._id,
        status: 'published',
      }).sort({ month: -1 });

      res.json({
        success: true,
        profile: publicProfile,
        isClaimed: true,
        metricSnapshot,
        issuesTakenUp,
        updates,
        reports,
        electionFreeze,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Correction request submission (/representatives/[id]/correct)
   */
  static async submitCorrectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = CorrectionRequestSchema.parse(req.body);

      const rep = await RepresentativeProfile.findById(id);
      if (!rep) {
        res.status(404).json({ success: false, message: 'Representative not found.' });
        return;
      }

      const correction = await CorrectionRequest.create({
        targetType: 'representative',
        targetId: rep._id,
        itemOrMetric: data.itemOrMetric,
        explanation: data.explanation,
        contactEmail: data.contactEmail,
        evidenceFileIds: data.evidenceFileIds || [],
        status: 'pending',
      });

      await AuditService.log({
        actorId: req.user?.userId || 'anonymous_public',
        actorRole: req.user?.role || 'public',
        action: 'representative_correction_requested',
        targetType: 'representative',
        targetId: rep._id.toString(),
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

  /**
   * Public Governance Directory (Rule 5: No shame leaderboards, neutral alphabetical or single-column sort)
   */
  static async getGovernanceDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sort = 'alphabetical', role, search } = req.query;

      const filter: any = { status: { $in: ['verified', 'unclaimed', 'term_ended'] } };
      if (role) filter.role = role;
      if (search) filter.displayName = { $regex: search as string, $options: 'i' };

      let repsQuery = RepresentativeProfile.find(filter).populate('jurisdictionId');

      if (sort === 'alphabetical') {
        repsQuery = repsQuery.sort({ displayName: 1 });
      } else {
        repsQuery = repsQuery.sort({ createdAt: -1 });
      }

      const representatives = await repsQuery.limit(100);

      // Collect issues taken up count for each rep
      const repIds = representatives.map((r) => r._id);
      const countsRaw = await Issue.aggregate([
        { $match: { takenUpByRepIds: { $in: repIds } } },
        { $unwind: '$takenUpByRepIds' },
        { $match: { takenUpByRepIds: { $in: repIds } } },
        { $group: { _id: '$takenUpByRepIds', count: { $sum: 1 } } },
      ]);

      const countMap: Record<string, number> = {};
      for (const c of countsRaw) {
        countMap[c._id.toString()] = c.count;
      }

      const result = representatives.map((r) => ({
        _id: r._id,
        displayName: r.displayName,
        role: r.role,
        titleText: r.titleText,
        jurisdiction: r.jurisdictionId,
        status: r.status,
        issuesTakenUpCount: countMap[r._id.toString()] || 0,
      }));

      res.json({
        success: true,
        representatives: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
