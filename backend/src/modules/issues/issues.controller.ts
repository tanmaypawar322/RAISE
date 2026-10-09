import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { Issue, IMediaItem } from '../../models/Issue.js';
import { Raise } from '../../models/Raise.js';
import { Office } from '../../models/Office.js';
import { StorageService } from '../../services/storage.service.js';
import { OtpService } from '../../services/otp.service.js';
import { OfficeRoutingService } from '../../services/office-routing.service.js';
import { EscalationService } from '../../services/escalation.service.js';
import { NotificationService } from '../../services/notification.service.js';
import { GeoUtil } from '../../utils/geo.util.js';
import { SimilarityUtil } from '../../utils/similarity.util.js';
import { AuditService } from '../../services/audit.service.js';
import { ModerationController } from '../moderation/moderation.controller.js';
import { config } from '../../config/env.js';

interface IpRateTracker {
  count: number;
  resetAt: number;
}
const anonymousIpLimits = new Map<string, IpRateTracker>();

export function checkAnonymousIpLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  const tracker = anonymousIpLimits.get(ip);
  if (!tracker || now > tracker.resetAt) {
    anonymousIpLimits.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true };
  }
  if (tracker.count >= 5) {
    return { allowed: false };
  }
  tracker.count++;
  return { allowed: true };
}

export function clearAnonymousLimitsForTesting() {
  anonymousIpLimits.clear();
}

/**
 * Serializes issue document for public consumption:
 * 1. Strictly redacts authorId so internal IDs are never exposed.
 * 2. If isAnonymous is true, author is displayed as 'Anonymous citizen'.
 * 3. If author account was deleted, author is displayed as 'Deleted user'.
 * 4. Otherwise exposes only safe public pseudonym and home area.
 */
export function serializeIssue(issue: any): any {
  const obj = issue.toObject ? issue.toObject() : { ...issue };

  const rawAuthor = obj.authorId;
  delete obj.authorId;

  if (obj.isAnonymous) {
    obj.author = { displayName: 'Anonymous citizen' };
  } else if (rawAuthor) {
    if (rawAuthor.status === 'deleted') {
      obj.author = { displayName: 'Deleted user' };
    } else {
      obj.author = {
        displayName: rawAuthor.displayName || rawAuthor.name || 'Citizen',
        homeArea: rawAuthor.homeArea,
      };
    }
  } else {
    obj.author = { displayName: 'Citizen' };
  }

  // Phase 5: Civic verification and status labels
  const dynamicLabels: string[] = [];
  if (obj.status === 'disputed' || (obj.reopenCount && obj.reopenCount > 0)) {
    dynamicLabels.push('Disputed');
  } else if ((obj.confirmedByCount && obj.confirmedByCount >= 3) || obj.confirmationStatus === 'resolved_confirmed') {
    dynamicLabels.push('Verified by citizens');
  } else if (obj.raiseCount < 3 && obj.status !== 'acknowledged' && obj.status !== 'in_progress') {
    dynamicLabels.push('Unverified claim');
  }
  obj.labels = Array.from(new Set([...dynamicLabels, ...(obj.moderationLabels || [])]));

  return obj;
}

const CreateIssueSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(10).max(2000),
  category: z.enum(['roads', 'water', 'sanitation', 'health', 'education', 'electricity', 'other']),
  officeId: z.string(),
  isAnonymous: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  latitude: z.preprocess((val) => parseFloat(val as string), z.number().min(-90).max(90)),
  longitude: z.preprocess((val) => parseFloat(val as string), z.number().min(-180).max(180)),
  address: z.string().optional(),
  ward: z.string().optional(),
  city: z.string().default('Pimpri-Chinchwad'),
  phone: z.string().optional(),
  otp: z.string().optional(),
  possibleDuplicateOf: z.string().optional(),
});

export class IssuesController {
  static async createIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CreateIssueSchema.parse(req.body);
      const files = req.files as Express.Multer.File[] | undefined;

      const office = await Office.findById(data.officeId);
      if (!office) {
        res.status(400).json({ success: false, message: 'Designated office not found.' });
        return;
      }

      let authorUserId: mongoose.Types.ObjectId;
      const isAnon = Boolean(data.isAnonymous || !req.user);
      const clientIp = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');

      if (!req.user) {
        // Unauthenticated guest reporting requires phone + OTP verification
        if (!data.phone || !data.otp) {
          res.status(400).json({
            success: false,
            message: 'Phone number and verification OTP are required for unauthenticated guest reporting.',
          });
          return;
        }

        const otpResult = await OtpService.verifyOtp(data.phone, data.otp);
        if (!otpResult.valid) {
          res.status(400).json({
            success: false,
            message: otpResult.reason || 'Invalid OTP code.',
          });
          return;
        }

        const normalizedPhone = OtpService.normalizePhone(data.phone);
        const phoneHash = OtpService.hashPhone(normalizedPhone);
        let guestUser = await User.findOne({ phoneHash });

        if (!guestUser) {
          guestUser = await User.create({
            name: 'Anonymous citizen',
            displayName: 'Anonymous citizen',
            phoneEnc: OtpService.encryptPhone(normalizedPhone),
            phoneHash,
            phoneMasked: OtpService.maskPhone(normalizedPhone),
            role: 'citizen',
            status: 'active',
            isProfileComplete: true,
          });
        }

        // Rate limit: max 2 anonymous issues per phone per 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const phoneCount = await Issue.countDocuments({
          authorId: guestUser._id,
          isAnonymous: true,
          createdAt: { $gte: twentyFourHoursAgo },
        });

        if (phoneCount >= 2) {
          res.status(429).json({
            success: false,
            message: 'Rate limit exceeded: You may only submit up to 2 anonymous issues per 24 hours.',
          });
          return;
        }

        // Rate limit: max 5 anonymous issues per IP per 24 hours
        const ipCheck = checkAnonymousIpLimit(clientIp);
        if (!ipCheck.allowed) {
          res.status(429).json({
            success: false,
            message: 'Rate limit exceeded: Maximum 5 anonymous issues allowed per IP address per 24 hours.',
          });
          return;
        }

        authorUserId = guestUser._id;
      } else {
        const user = await User.findById(req.user.userId);
        if (!user) {
          res.status(401).json({ success: false, message: 'User not found' });
          return;
        }

        if (config.authRequirePhoneToRaise && !user.phoneHash) {
          res.status(403).json({
            success: false,
            message: 'A verified phone number is required before raising or supporting issues.',
          });
          return;
        }

        if (config.authRequireEmailVerification && !user.emailVerified && !user.phoneHash) {
          res.status(403).json({
            success: false,
            message: 'Email verification is required before raising or supporting issues.',
          });
          return;
        }

        // New account limit (accounts created < 24h ago)
        const isNewAccount = Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000;
        if (isNewAccount) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const [recentIssues, recentRaises] = await Promise.all([
            Issue.countDocuments({ authorId: user._id, createdAt: { $gte: twentyFourHoursAgo } }),
            Raise.countDocuments({ userId: user._id, createdAt: { $gte: twentyFourHoursAgo } }),
          ]);
          if (recentIssues + recentRaises >= config.newAccountDailyActionLimit) {
            res.status(429).json({
              success: false,
              message: `New account daily action limit reached (${config.newAccountDailyActionLimit} actions/day). Please wait before creating more grievances.`,
            });
            return;
          }
        }

        authorUserId = user._id;

        if (data.isAnonymous) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const phoneCount = await Issue.countDocuments({
            authorId: authorUserId,
            isAnonymous: true,
            createdAt: { $gte: twentyFourHoursAgo },
          });

          if (phoneCount >= 2) {
            res.status(429).json({
              success: false,
              message: 'Rate limit exceeded: You may only submit up to 2 anonymous issues per 24 hours.',
            });
            return;
          }

          const ipCheck = checkAnonymousIpLimit(clientIp);
          if (!ipCheck.allowed) {
            res.status(429).json({
              success: false,
              message: 'Rate limit exceeded: Maximum 5 anonymous issues allowed per IP address per 24 hours.',
            });
            return;
          }
        }
      }

      const mediaItems: IMediaItem[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          if (file.mimetype.startsWith('image/')) {
            const processed = await StorageService.saveImage(file.buffer, file.originalname);
            mediaItems.push({
              type: 'photo',
              url: processed.url,
              filename: processed.filename,
              mimeType: processed.mimeType,
              sizeBytes: processed.sizeBytes,
            });
          } else if (file.mimetype.startsWith('audio/')) {
            const processed = await StorageService.saveVoiceNote(file.buffer, file.originalname.split('.').pop());
            mediaItems.push({
              type: 'voice_note',
              url: processed.url,
              filename: processed.filename,
              mimeType: processed.mimeType,
              sizeBytes: processed.sizeBytes,
            });
          }
        }
      }

      const slaHours = OfficeRoutingService.resolveSlaHours(office, data.category, 48);
      const slaDeadline = EscalationService.calculateSlaDeadline(new Date(), slaHours);

      // Phase 5: Automated trilingual content pre-screening
      const { getModerationProvider } = await import('../../services/moderation/moderation-provider.js');
      const modResult = await getModerationProvider().checkText(`${data.title} ${data.description}`);

      if (modResult.decision === 'block') {
        res.status(422).json({
          success: false,
          message: modResult.reason || 'Content rejected: Violates civic safety and decency policies.',
        });
        return;
      }

      const initialStatus = modResult.decision === 'review' ? 'under_review' : 'published';
      const initialModState = modResult.decision === 'review' ? 'flagged' : 'clean';

      const issue = await Issue.create({
        authorId: authorUserId,
        isAnonymous: isAnon,
        title: data.title,
        description: data.description,
        category: data.category,
        officeId: office._id,
        jurisdictionId: office.jurisdictionId,
        slaHours,
        slaDeadline,
        escalationLevel: 0,
        escalationHistory: [],
        location: {
          type: 'Point',
          coordinates: [data.longitude, data.latitude],
          address: data.address,
          ward: data.ward,
          city: data.city,
        },
        media: mediaItems,
        status: initialStatus,
        moderationState: initialModState,
        moderationLabels: modResult.labels,
        possibleDuplicateOf: data.possibleDuplicateOf && mongoose.isValidObjectId(data.possibleDuplicateOf)
          ? new mongoose.Types.ObjectId(data.possibleDuplicateOf)
          : undefined,
        raiseCount: 1,
        statusTimeline: [
          {
            status: initialStatus === 'under_review' ? 'under_review' : 'submitted',
            note: initialStatus === 'under_review' ? 'Held for moderator screening' : 'Issue raised by citizen',
            updatedBy: authorUserId,
            updatedAt: new Date(),
          },
        ],
      });

      await Raise.create({
        userId: authorUserId,
        issueId: issue._id,
        weight: 1.0,
      }).catch(() => {});

      await Office.findByIdAndUpdate(office._id, { $inc: { 'stats.issuesTotal': 1 } });

      // Trigger notifications asynchronously
      const linkUrl = `${config.publicBaseUrl}/issues/${issue._id}`;
      if (initialStatus === 'published') {
        NotificationService.notifyUser({
          userId: authorUserId,
          type: 'issue_published',
          vars: { issueTitle: issue.title, officeName: office.name, linkUrl },
          data: { issueId: issue._id, linkUrl },
          dedupKey: `issue_published_${issue._id}`,
        }).catch((err) => console.warn('[Notification] Failed to notify creator on createIssue:', err.message));

        NotificationService.notifyOfficeMembers(
          office._id,
          'office_new_assignment',
          { issueTitle: issue.title, ward: issue.location?.ward || 'Ward 12', linkUrl },
          { issueId: issue._id, linkUrl },
          `office_new_assignment_${issue._id}`
        ).catch((err) => console.warn('[Notification] Failed to notify office on createIssue:', err.message));
      } else {
        NotificationService.notifyUser({
          userId: authorUserId,
          type: 'moderation_outcome',
          vars: { issueTitle: issue.title, outcome: 'held for moderator screening' },
          data: { issueId: issue._id },
          dedupKey: `mod_hold_${issue._id}`,
        }).catch(() => {});
      }

      res.status(201).json({ success: true, issue: serializeIssue(issue) });
    } catch (err) {
      next(err);
    }

  }

  static async getIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        q,
        category,
        status,
        ward,
        jurisdictionId,
        officeId,
        dateFrom,
        dateTo,
        sort = 'trending',
        lng,
        lat,
        maxDistance = 10000,
        page = 1,
        limit = 20,
        cursor,
      } = req.query;

      const filter: any = { moderationState: { $ne: 'hidden' } };

      // Free-text search (MongoDB regex fallback for partial matches and Hindi/Marathi phrases)
      if (q && typeof q === 'string' && q.trim()) {
        const queryTerm = q.trim();
        const escaped = queryTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        filter.$or = [{ title: regex }, { description: regex }];
      }

      if (category && category !== 'all') {
        filter.category = category;
      }

      if (status && status !== 'all') {
        if (status === 'open') {
          filter.status = { $in: ['submitted', 'published', 'acknowledged', 'in_progress', 'disputed'] };
        } else {
          filter.status = status;
        }
      } else if (!status) {
        // By default show all published civic grievances
        filter.status = {
          $in: [
            'published',
            'acknowledged',
            'in_progress',
            'resolved_pending_confirmation',
            'resolved',
            'disputed',
            'rejected',
            'merged',
          ],
        };
      }

      if (ward && typeof ward === 'string' && ward.trim()) {
        filter['location.ward'] = { $regex: new RegExp(ward.trim(), 'i') };
      }

      if (jurisdictionId && mongoose.isValidObjectId(jurisdictionId as string)) {
        filter.jurisdictionId = new mongoose.Types.ObjectId(jurisdictionId as string);
      }

      if (officeId && mongoose.isValidObjectId(officeId as string)) {
        filter.officeId = new mongoose.Types.ObjectId(officeId as string);
      }

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
      }

      if (lng && lat) {
        filter['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng as string), parseFloat(lat as string)],
            },
            $maxDistance: parseInt(maxDistance as string, 10),
          },
        };
      }

      // Neutrality rule: Sorting depends strictly on public support (raiseCount), recency (createdAt/updatedAt), or SLA urgency
      let sortOption: any = { createdAt: -1, _id: -1 };
      if (sort === 'trending' || sort === 'most_raised') {
        sortOption = { raiseCount: -1, _id: -1 };
      } else if (sort === 'newest') {
        sortOption = { createdAt: -1, _id: -1 };
      } else if (sort === 'recently_updated') {
        sortOption = { updatedAt: -1, _id: -1 };
      } else if (sort === 'overdue') {
        filter.slaDeadline = { $lt: new Date() };
        filter.status = { $in: ['submitted', 'published', 'acknowledged', 'in_progress'] };
        sortOption = { slaDeadline: 1, _id: -1 };
      }

      // Cursor-based pagination logic (deterministic keyset pagination)
      if (cursor && typeof cursor === 'string') {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
          if (decoded && decoded.id && mongoose.isValidObjectId(decoded.id)) {
            const cursorId = new mongoose.Types.ObjectId(decoded.id);
            const cursorSort = decoded.sort || sort;

            filter.$and = filter.$and || [];
            if (cursorSort === 'trending' || cursorSort === 'most_raised') {
              const cVal = Number(decoded.val) || 0;
              filter.$and.push({
                $or: [
                  { raiseCount: { $lt: cVal } },
                  { raiseCount: cVal, _id: { $lt: cursorId } },
                ],
              });
            } else if (cursorSort === 'newest') {
              const cDate = new Date(decoded.val);
              filter.$and.push({
                $or: [
                  { createdAt: { $lt: cDate } },
                  { createdAt: cDate, _id: { $lt: cursorId } },
                ],
              });
            } else if (cursorSort === 'recently_updated') {
              const cDate = new Date(decoded.val);
              filter.$and.push({
                $or: [
                  { updatedAt: { $lt: cDate } },
                  { updatedAt: cDate, _id: { $lt: cursorId } },
                ],
              });
            } else if (cursorSort === 'overdue') {
              const cDate = new Date(decoded.val);
              filter.$and.push({
                $or: [
                  { slaDeadline: { $gt: cDate } },
                  { slaDeadline: cDate, _id: { $lt: cursorId } },
                ],
              });
            }
          }
        } catch {
          // Fall back gracefully if cursor format is corrupted
        }
      }

      const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 50);
      const skip = cursor ? 0 : (Math.max(parseInt(page as string, 10) || 1, 1) - 1) * parsedLimit;

      const issues = await Issue.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parsedLimit + 1)
        .populate('officeId', 'name nameMr department level jurisdiction')
        .populate('authorId', 'displayName homeArea name status');

      const total = await Issue.countDocuments(filter);
      const hasMore = issues.length > parsedLimit;
      if (hasMore) {
        issues.pop();
      }

      let nextCursor: string | null = null;
      if (hasMore && issues.length > 0) {
        const last = issues[issues.length - 1];
        let lastVal: any = last.raiseCount;
        if (sort === 'newest') lastVal = last.createdAt.toISOString();
        else if (sort === 'recently_updated') lastVal = last.updatedAt.toISOString();
        else if (sort === 'overdue') lastVal = last.slaDeadline ? last.slaDeadline.toISOString() : null;
        else lastVal = last.raiseCount;

        nextCursor = Buffer.from(
          JSON.stringify({ id: last._id.toString(), val: lastVal, sort })
        ).toString('base64url');
      }

      res.json({
        success: true,
        total,
        page: parseInt(page as string, 10) || 1,
        limit: parsedLimit,
        hasMore,
        nextCursor,
        issues: issues.map(serializeIssue),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMapBounds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { minLng, minLat, maxLng, maxLat, category, status, limit = 200 } = req.query;

      if (!minLng || !minLat || !maxLng || !maxLat) {
        res.status(400).json({
          success: false,
          message: 'Bounding box coordinates (minLng, minLat, maxLng, maxLat) are required.',
        });
        return;
      }

      const minX = parseFloat(minLng as string);
      const minY = parseFloat(minLat as string);
      const maxX = parseFloat(maxLng as string);
      const maxY = parseFloat(maxLat as string);

      if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) {
        res.status(400).json({ success: false, message: 'Invalid coordinates provided.' });
        return;
      }

      const filter: any = {
        moderationState: { $ne: 'hidden' },
        status: {
          $in: [
            'published',
            'acknowledged',
            'in_progress',
            'resolved_pending_confirmation',
            'resolved',
            'disputed',
          ],
        },
        'location.coordinates.0': { $gte: minX, $lte: maxX },
        'location.coordinates.1': { $gte: minY, $lte: maxY },
      };

      if (category && category !== 'all') filter.category = category;
      if (status && status !== 'all') filter.status = status;

      const maxPins = Math.min(parseInt(limit as string, 10) || 200, 300);

      const pins = await Issue.find(filter)
        .select('_id title category status raiseCount location createdAt slaDeadline slaHours')
        .populate('officeId', 'name nameMr department')
        .limit(maxPins)
        .lean();

      const formattedPins = pins.map((p: any) => ({
        _id: p._id,
        title: p.title,
        category: p.category,
        status: p.status,
        raiseCount: p.raiseCount,
        coordinates: p.location?.coordinates || [0, 0],
        address: p.location?.address || '',
        ward: p.location?.ward || '',
        office: p.officeId
          ? {
              name: p.officeId.name,
              nameMr: p.officeId.nameMr,
              department: p.officeId.department,
            }
          : undefined,
        createdAt: p.createdAt,
      }));

      res.json({
        success: true,
        count: formattedPins.length,
        pins: formattedPins,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getIssueById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      const issue = await Issue.findById(id)
        .populate('officeId')
        .populate('authorId', 'displayName homeArea name status');

      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      // Phase 3 Public issue visibility:
      // Only published+ issues are public; hidden/draft/under_review return 404 with a neutral page
      // unless requester is the author or an official/admin
      const isPublicStatus = !['draft', 'submitted', 'under_review'].includes(issue.status);
      const isPublicModeration = issue.moderationState !== 'hidden';

      if (!isPublicStatus || !isPublicModeration) {
        const isAuthor =
          req.user &&
          issue.authorId &&
          req.user.userId.toString() === (issue.authorId as any)._id?.toString();
        const isPrivileged = req.user && ['admin', 'official', 'agency'].includes(req.user.role);

        if (!isAuthor && !isPrivileged) {
          res.status(404).json({ success: false, message: 'Issue not found or no longer public' });
          return;
        }
      }

      if (issue.status === 'merged' && issue.mergedIntoId) {
        res.json({
          success: true,
          isMerged: true,
          mergedIntoId: issue.mergedIntoId,
          issue: serializeIssue(issue),
        });
        return;
      }

      res.json({ success: true, issue: serializeIssue(issue) });
    } catch (err) {
      next(err);
    }
  }

  static async getMyIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const issues = await Issue.find({ authorId: req.user.userId })
        .sort({ createdAt: -1 })
        .populate('officeId', 'name nameMr department claimStatus');

      res.json({ success: true, issues: issues.map(serializeIssue) });
    } catch (err) {
      next(err);
    }
  }

  static async getMySupportedIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const raises = await Raise.find({ userId: req.user.userId }).select('issueId');
      const issueIds = raises.map((r) => r.issueId);

      const issues = await Issue.find({ _id: { $in: issueIds } })
        .sort({ createdAt: -1 })
        .populate('officeId', 'name nameMr department claimStatus');

      res.json({ success: true, issues: issues.map(serializeIssue) });
    } catch (err) {
      next(err);
    }
  }

  static async getOfficeIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { officeId } = req.params;
      const { status } = req.query;

      const filter: any = { officeId };
      if (status) filter.status = status;

      const issues = await Issue.find(filter)
        .sort({ raiseCount: -1, createdAt: -1 })
        .populate('authorId', 'displayName homeArea status');

      res.json({ success: true, issues: issues.map(serializeIssue) });
    } catch (err) {
      next(err);
    }
  }

  static async raiseIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Please log in to raise this issue.' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      if (config.authRequirePhoneToRaise && !user.phoneHash) {
        res.status(403).json({
          success: false,
          message: 'A verified phone number is required before raising or supporting issues.',
        });
        return;
      }

      if (config.authRequireEmailVerification && !user.emailVerified && !user.phoneHash) {
        res.status(403).json({
          success: false,
          message: 'Email verification is required before raising or supporting issues.',
        });
        return;
      }

      // New account limit (accounts created < 24h ago)
      const isNewAccount = Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000;
      if (isNewAccount) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [recentIssues, recentRaises] = await Promise.all([
          Issue.countDocuments({ authorId: user._id, createdAt: { $gte: twentyFourHoursAgo } }),
          Raise.countDocuments({ userId: user._id, createdAt: { $gte: twentyFourHoursAgo } }),
        ]);
        if (recentIssues + recentRaises >= config.newAccountDailyActionLimit) {
          res.status(429).json({
            success: false,
            message: `New account daily action limit reached (${config.newAccountDailyActionLimit} actions/day). Please wait before supporting more grievances.`,
          });
          return;
        }
      }

      const { id } = req.params;
      const issue = await Issue.findById(id);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      const existingRaise = await Raise.findOne({
        userId: user._id,
        issueId: issue._id,
      });

      if (existingRaise) {
        res.status(409).json({
          success: false,
          message: 'You have already raised this issue.',
        });
        return;
      }

      try {
        await Raise.create({
          userId: user._id,
          issueId: issue._id,
          weight: 1.0,
        });
      } catch (err: any) {
        if (err.code === 11000) {
          res.status(409).json({
            success: false,
            message: 'You have already raised this issue.',
          });
          return;
        }
        throw err;
      }

      const updated = await Issue.findByIdAndUpdate(
        issue._id,
        { $inc: { raiseCount: 1 } },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Successfully raised this issue!',
        raiseCount: updated?.raiseCount,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      const {
        status,
        note,
        resolutionNotes,
        rejectionReason,
        exceptionReason,
        afterPhotos,
        afterPhotoCoordinates,
      } = req.body;

      const issue = await Issue.findById(id);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      // 1. Fetch authenticated user
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User account not found.' });
        return;
      }

      // 2. Pending account check
      if (user.status === 'pending') {
        res.status(403).json({
          success: false,
          message: 'Account pending verification. Privileged actions require approved status.',
        });
        return;
      }
      if (user.status === 'suspended') {
        res.status(403).json({ success: false, message: 'Account is suspended.' });
        return;
      }

      // 3. Object-level authorization (IDOR prevention)
      if (user.role === 'admin') {
        // Platform admin can act on any office's issue, with audit logging
      } else {
        const owningOffice = await Office.findById(issue.officeId);
        const allowedOfficeIds = [issue.officeId.toString()];
        if (owningOffice?.escalatesToOfficeId) {
          allowedOfficeIds.push(owningOffice.escalatesToOfficeId.toString());
        }
        if (owningOffice?.parentOfficeId) {
          allowedOfficeIds.push(owningOffice.parentOfficeId.toString());
        }

        const hasOfficeAccess =
          (user.officeMemberships &&
            user.officeMemberships.some(
              (m) => allowedOfficeIds.includes(m.officeId.toString()) && m.status === 'active'
            )) ||
          (user.officialOfficeId &&
            allowedOfficeIds.includes(user.officialOfficeId.toString()) &&
            user.isOfficialVerified);

        if (!hasOfficeAccess) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You can only manage issues assigned to your office or escalation hierarchy.',
          });
          return;
        }

        // 4. Contractor / Agency status restriction
        const isContractor =
          user.role === 'agency' ||
          (user.officeMemberships &&
            user.officeMemberships.some(
              (m) =>
                m.officeId.toString() === issue.officeId.toString() &&
                m.memberRole === 'contractor' &&
                m.status === 'active'
            ));

        if (isContractor && (status === 'resolved' || status === 'resolved_pending_confirmation')) {
          res.status(403).json({
            success: false,
            message: 'Agency contractors cannot mark issues as resolved. Resolution requires official verification.',
          });
          return;
        }
      }

      // 5. Resolution Proof enforcement
      if (status === 'resolved' || status === 'resolved_pending_confirmation') {
        const finalNote = (resolutionNotes || note || '').trim();
        if (finalNote.length < 10) {
          res.status(422).json({
            success: false,
            message: 'A detailed resolution note (minimum 10 characters) is required when marking an issue resolved.',
          });
          return;
        }

        const hasAfterPhotos = Array.isArray(afterPhotos) && afterPhotos.length > 0;
        const validExceptions = [
          'no_physical_work_required',
          'administrative_action_only',
          'duplicate_work_order',
          'jurisdiction_transferred',
        ];
        const hasValidException = exceptionReason && validExceptions.includes(exceptionReason);

        if (!hasAfterPhotos && !hasValidException) {
          res.status(422).json({
            success: false,
            message:
              'Resolution proof required: You must provide at least one "after" photo or select an explicit exception reason.',
          });
          return;
        }

        // GPS Distance Verification
        const photoCoords = afterPhotoCoordinates || afterPhotos?.[0]?.coordinates;
        if (photoCoords && issue.location?.coordinates) {
          const distMeters = GeoUtil.haversineDistanceMeters(photoCoords, issue.location.coordinates);
          issue.afterPhotoDistanceMeters = Math.round(distMeters);
          const maxAllowed = config.gpsRadiusMeters || 150;
          if (distMeters > maxAllowed) {
            issue.afterPhotoGpsFlag = true;
          }
        }

        if (hasAfterPhotos) {
          issue.afterPhotos = afterPhotos.map((p: any) => ({
            type: p.type || 'photo',
            url: p.url,
            filename: p.filename || 'after_photo.jpg',
            mimeType: p.mimeType || 'image/jpeg',
            sizeBytes: p.sizeBytes,
            durationSec: p.durationSec,
          }));
        }

        if (hasValidException) {
          issue.resolutionExceptionReason = exceptionReason;
        }

        issue.resolutionNotes = finalNote;
        if (!issue.resolutionNotesHistory) {
          issue.resolutionNotesHistory = [];
        }
        issue.resolutionNotesHistory.push({
          note: finalNote,
          editedBy: user._id as mongoose.Types.ObjectId,
          editedAt: new Date(),
        });

        // Always enters the 7-day citizen confirmation window
        issue.status = 'resolved_pending_confirmation';
        issue.resolvedAt = new Date();
        issue.confirmationDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        issue.confirmationStatus = 'pending_citizen_confirmation';

        issue.statusTimeline.push({
          status: 'resolved_pending_confirmation',
          note: finalNote,
          updatedBy: user._id as mongoose.Types.ObjectId,
          updatedAt: new Date(),
        });

        await issue.save();
        await Office.findByIdAndUpdate(issue.officeId, { $inc: { 'stats.issuesResolved': 1 } });

        await AuditService.log({
          actorId: user._id,
          actorRole: user.role,
          action: 'issue_resolved_pending_confirmation',
          targetType: 'issue',
          targetId: issue._id,
          details: {
            gpsFlag: issue.afterPhotoGpsFlag,
            distanceMeters: issue.afterPhotoDistanceMeters,
            exceptionReason: issue.resolutionExceptionReason,
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });

        // Trigger notifications for resolution pending confirmation
        const linkUrl = `${config.publicBaseUrl}/issues/${issue._id}`;
        if (issue.authorId) {
          NotificationService.notifyUser({
            userId: issue.authorId,
            type: 'issue_resolved_pending_confirmation',
            vars: { issueTitle: issue.title, linkUrl },
            data: { issueId: issue._id, linkUrl },
            dedupKey: `issue_resolved_${issue._id}`,
          }).catch((err) => console.warn('[Notification] Failed to notify creator on resolve:', err.message));
        }

        NotificationService.notifyIssueSupporters(
          issue._id,
          'issue_resolved_pending_confirmation',
          { issueTitle: issue.title, linkUrl },
          { issueId: issue._id, linkUrl },
          issue.authorId || undefined
        ).catch((err) => console.warn('[Notification] Failed to notify supporters on resolve:', err.message));

        res.json({
          success: true,
          message: 'Issue marked resolved and opened for 7-day citizen confirmation.',
          issue: serializeIssue(issue),
        });
        return;
      }

      // 6. Rejection handling
      if (status === 'rejected') {
        const reason = (rejectionReason || note || '').trim();
        if (reason.length < 5) {
          res.status(422).json({
            success: false,
            message: 'A clear rejection reason (minimum 5 characters) is required when rejecting an issue.',
          });
          return;
        }

        issue.status = 'rejected';
        issue.rejectionReason = reason;
        issue.statusTimeline.push({
          status: 'rejected',
          note: `Rejected: ${reason}`,
          updatedBy: user._id as mongoose.Types.ObjectId,
          updatedAt: new Date(),
        });

        await issue.save();

        await AuditService.log({
          actorId: user._id,
          actorRole: user.role,
          action: 'issue_rejected',
          targetType: 'issue',
          targetId: issue._id,
          details: { reason },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });

        // Trigger rejection notifications
        if (issue.authorId) {
          NotificationService.notifyUser({
            userId: issue.authorId,
            type: 'issue_status_updated',
            vars: { issueTitle: issue.title, status: 'rejected', reason },
            data: { issueId: issue._id },
            dedupKey: `issue_rejected_${issue._id}`,
          }).catch((err) => console.warn('[Notification] Failed to notify creator on rejection:', err.message));
        }

        NotificationService.notifyIssueSupporters(
          issue._id,
          'supported_issue_updated',
          { issueTitle: issue.title, status: 'rejected' },
          { issueId: issue._id },
          issue.authorId || undefined
        ).catch((err) => console.warn('[Notification] Failed to notify supporters on rejection:', err.message));

        res.json({ success: true, message: 'Issue rejected.', issue: serializeIssue(issue) });
        return;
      }

      // 7. General status updates ('acknowledged', 'in_progress')
      issue.status = status;
      issue.statusTimeline.push({
        status,
        note: note || `Status updated to ${status}`,
        updatedBy: user._id as mongoose.Types.ObjectId,
        updatedAt: new Date(),
      });

      await issue.save();

      if (status === 'acknowledged') {
        await Office.findByIdAndUpdate(issue.officeId, { $inc: { 'stats.issuesAcknowledged': 1 } });
      }

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: `issue_status_${status}`,
        targetType: 'issue',
        targetId: issue._id,
        details: { status, note },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Trigger status notifications
      const updateLinkUrl = `${config.publicBaseUrl}/issues/${issue._id}`;
      if (status === 'acknowledged') {
        Office.findById(issue.officeId).then((office) => {
          if (issue.authorId) {
            NotificationService.notifyUser({
              userId: issue.authorId,
              type: 'issue_acknowledged',
              vars: { issueTitle: issue.title, officeName: office?.name, linkUrl: updateLinkUrl },
              data: { issueId: issue._id, linkUrl: updateLinkUrl },
              dedupKey: `issue_acknowledged_${issue._id}`,
            }).catch((err) => console.warn('[Notification] Failed to notify creator on ack:', err.message));
          }

          NotificationService.notifyIssueSupporters(
            issue._id,
            'issue_acknowledged',
            { issueTitle: issue.title, officeName: office?.name, linkUrl: updateLinkUrl },
            { issueId: issue._id, linkUrl: updateLinkUrl },
            issue.authorId || undefined
          ).catch((err) => console.warn('[Notification] Failed to notify supporters on ack:', err.message));
        }).catch(() => {});
      } else {
        if (issue.authorId) {
          NotificationService.notifyUser({
            userId: issue.authorId,
            type: 'issue_status_updated',
            vars: { issueTitle: issue.title, status },
            data: { issueId: issue._id },
            dedupKey: `issue_status_${status}_${issue._id}`,
          }).catch((err) => console.warn('[Notification] Failed to notify creator on status update:', err.message));
        }

        NotificationService.notifyIssueSupporters(
          issue._id,
          'supported_issue_updated',
          { issueTitle: issue.title, status },
          { issueId: issue._id },
          issue.authorId || undefined
        ).catch((err) => console.warn('[Notification] Failed to notify supporters on status update:', err.message));
      }


      res.json({ success: true, issue: serializeIssue(issue) });
    } catch (err) {
      next(err);
    }

  }

  static async confirmIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required to confirm resolution.' });
        return;
      }

      const { id } = req.params;
      const issue = await Issue.findById(id);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      if (issue.status !== 'resolved_pending_confirmation' && issue.status !== 'resolved') {
        res.status(400).json({
          success: false,
          message: 'Issue is not in resolved or pending confirmation state.',
        });
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const alreadyConfirmed = (issue.confirmations || []).some(
        (c) => c.userId.toString() === userId.toString()
      );
      if (alreadyConfirmed) {
        res.status(409).json({
          success: false,
          message: 'You have already confirmed this resolution.',
        });
        return;
      }

      if (!issue.confirmations) {
        issue.confirmations = [];
      }
      issue.confirmations.push({
        userId,
        confirmedAt: new Date(),
      });
      issue.confirmedByCount = (issue.confirmedByCount || 0) + 1;
      issue.status = 'resolved';
      issue.confirmationStatus = 'resolved_confirmed';

      issue.statusTimeline.push({
        status: 'resolved',
        note: `Citizen confirmed resolution. (${issue.confirmedByCount} confirmation${issue.confirmedByCount > 1 ? 's' : ''})`,
        updatedBy: userId,
        updatedAt: new Date(),
      });

      await issue.save();

      await AuditService.log({
        actorId: userId,
        actorRole: req.user.role,
        action: 'issue_confirmed_by_citizen',
        targetType: 'issue',
        targetId: issue._id,
        details: { confirmedByCount: issue.confirmedByCount },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Trigger confirmation notifications
      if (issue.authorId) {
        NotificationService.notifyUser({
          userId: issue.authorId,
          type: 'issue_status_updated',
          vars: { issueTitle: issue.title, status: 'resolved' },
          data: { issueId: issue._id },
          dedupKey: `issue_confirmed_${issue._id}`,
        }).catch((err) => console.warn('[Notification] Failed to notify creator on confirm:', err.message));
      }

      NotificationService.notifyIssueSupporters(
        issue._id,
        'supported_issue_updated',
        { issueTitle: issue.title, status: 'resolved' },
        { issueId: issue._id },
        userId
      ).catch((err) => console.warn('[Notification] Failed to notify supporters on confirm:', err.message));

      res.json({
        success: true,
        message: 'Resolution confirmed. Thank you for making your ward better!',
        issue: serializeIssue(issue),
      });
    } catch (err) {
      next(err);
    }
  }

  static async disputeIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required to dispute resolution.' });
        return;
      }

      const { id } = req.params;
      const { reason, photoUrl } = req.body;

      if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
        res.status(422).json({
          success: false,
          message: 'A clear dispute reason (minimum 5 characters) is required.',
        });
        return;
      }

      const issue = await Issue.findById(id);
      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.userId);

      issue.status = 'disputed';
      issue.reopenCount = (issue.reopenCount || 0) + 1;
      issue.disputedByCount = (issue.disputedByCount || 0) + 1;
      if (!issue.disputes) {
        issue.disputes = [];
      }
      issue.disputes.push({
        userId,
        reason: reason.trim(),
        photoUrl,
        disputedAt: new Date(),
      });

      // Restart SLA clock
      const slaHours = issue.slaHours || 48;
      issue.slaDeadline = EscalationService.calculateSlaDeadline(new Date(), slaHours);

      issue.statusTimeline.push({
        status: 'disputed',
        note: `Resolution disputed by citizen: "${reason.trim()}". SLA clock restarted (${slaHours}h).`,
        updatedBy: userId,
        updatedAt: new Date(),
      });

      await issue.save();

      await AuditService.log({
        actorId: userId,
        actorRole: req.user.role,
        action: 'issue_disputed_by_citizen',
        targetType: 'issue',
        targetId: issue._id,
        details: {
          reason: reason.trim(),
          reopenCount: issue.reopenCount,
          newSlaDeadline: issue.slaDeadline,
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Trigger dispute notifications
      const linkUrl = `${config.publicBaseUrl}/issues/${issue._id}`;
      // Notify responsible office
      NotificationService.notifyOfficeMembers(
        issue.officeId,
        'issue_disputed',
        { issueTitle: issue.title, linkUrl, reason: reason.trim() },
        { issueId: issue._id, linkUrl },
        `issue_disputed_office_${issue._id}`
      ).catch((err) => console.warn('[Notification] Failed to notify office on dispute:', err.message));

      // Notify creator
      if (issue.authorId) {
        NotificationService.notifyUser({
          userId: issue.authorId,
          type: 'issue_disputed',
          vars: { issueTitle: issue.title, linkUrl, reason: reason.trim() },
          data: { issueId: issue._id, linkUrl },
          dedupKey: `issue_disputed_creator_${issue._id}`,
        }).catch((err) => console.warn('[Notification] Failed to notify creator on dispute:', err.message));
      }

      // Notify supporters
      NotificationService.notifyIssueSupporters(
        issue._id,
        'issue_disputed',
        { issueTitle: issue.title, linkUrl, reason: reason.trim() },
        { issueId: issue._id, linkUrl },
        userId
      ).catch((err) => console.warn('[Notification] Failed to notify supporters on dispute:', err.message));

      res.json({
        success: true,
        message: 'Resolution disputed and grievance reopened for office action.',
        issue: serializeIssue(issue),
      });
    } catch (err) {
      next(err);
    }
  }

  static async flagIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    req.body.targetId = req.params.id;
    req.body.targetType = 'issue';
    return ModerationController.submitReport(req, res, next);
  }



  static async getSimilarIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const QuerySchema = z.object({
        lat: z.coerce.number().min(-90).max(90),
        lng: z.coerce.number().min(-180).max(180),
        category: z.string().optional(),
        text: z.string().optional().default(''),
        radiusMeters: z.coerce.number().min(10).max(1000).default(100),
      });

      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Invalid search parameters', errors: parsed.error.issues });
        return;
      }

      const { lat, lng, category, text, radiusMeters } = parsed.data;

      // Filter: open grievances from last 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const filter: any = {
        status: { $in: ['submitted', 'published', 'acknowledged', 'in_progress', 'resolved_pending_confirmation'] },
        createdAt: { $gte: ninetyDaysAgo },
      };

      if (category && category !== 'all') {
        filter.category = category;
      }

      const candidates = await Issue.find(filter)
        .select('_id title description category location raiseCount status createdAt media')
        .lean();

      const results = [];
      const queryCoords: [number, number] = [lng, lat];

      for (const item of candidates) {
        if (!item.location?.coordinates) continue;
        const dist = GeoUtil.haversineDistanceMeters(queryCoords, item.location.coordinates);
        if (dist <= radiusMeters) {
          const textScore = text
            ? SimilarityUtil.jaccardSimilarity(item.title + ' ' + item.description, text)
            : 0;
          const score = text
            ? SimilarityUtil.calculateCombinedScore(textScore, dist, radiusMeters)
            : Number((1 - dist / radiusMeters).toFixed(4));

          results.push({
            _id: item._id,
            title: item.title,
            category: item.category,
            distanceMeters: Math.round(dist),
            similarityScore: score,
            textSimilarity: textScore,
            raiseCount: item.raiseCount,
            status: item.status,
            createdAt: item.createdAt,
            thumbnail: item.media?.[0]?.url,
          });
        }
      }

      results.sort((a, b) => b.similarityScore - a.similarityScore);
      const top3 = results.slice(0, 3);

      res.json({
        success: true,
        count: top3.length,
        similarIssues: top3,
      });
    } catch (err) {
      next(err);
    }
  }

  static async mergeIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params; // canonical issue ID
      const { duplicateIssueIds } = req.body;

      if (!Array.isArray(duplicateIssueIds) || duplicateIssueIds.length === 0) {
        res.status(400).json({ success: false, message: 'duplicateIssueIds array is required.' });
        return;
      }

      const canonical = await Issue.findById(id);
      if (!canonical) {
        res.status(404).json({ success: false, message: 'Canonical issue not found' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      // Authorization: Admin or Owning Office Coordinator/Head
      if (user.role !== 'admin') {
        const isOwningOffice =
          (user.officeMemberships &&
            user.officeMemberships.some(
              (m) =>
                m.officeId.toString() === canonical.officeId.toString() &&
                m.status === 'active' &&
                (m.memberRole === 'head' || m.memberRole === 'officer')
            )) ||
          (user.officialOfficeId &&
            user.officialOfficeId.toString() === canonical.officeId.toString() &&
            user.isOfficialVerified);

        if (!isOwningOffice) {
          res.status(403).json({
            success: false,
            message: 'Access denied: Only platform admins or owning office coordinators can merge grievances.',
          });
          return;
        }
      }

      const mergedDuplicates = [];

      for (const dupId of duplicateIssueIds) {
        if (dupId === id) continue; // cannot merge canonical into itself

        const duplicate = await Issue.findById(dupId);
        if (!duplicate || duplicate.status === 'merged') continue;

        // 1. Move and deduplicate raises
        const duplicateRaises = await Raise.find({ issueId: duplicate._id });
        for (const r of duplicateRaises) {
          const alreadyRaisedCanonical = await Raise.findOne({
            userId: r.userId,
            issueId: canonical._id,
          });
          if (!alreadyRaisedCanonical) {
            await Raise.create({
              userId: r.userId,
              issueId: canonical._id,
              weight: r.weight || 1.0,
            });
          }
        }

        // 2. Combine media
        if (duplicate.media && duplicate.media.length > 0) {
          for (const m of duplicate.media) {
            canonical.media.push(m);
          }
        }

        // 3. Mark duplicate as merged
        duplicate.status = 'merged';
        duplicate.mergedIntoId = canonical._id as mongoose.Types.ObjectId;
        duplicate.mergedAt = new Date();
        duplicate.mergedBy = user._id as mongoose.Types.ObjectId;
        duplicate.canUnmergeUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day undo window
        duplicate.statusTimeline.push({
          status: 'merged',
          note: `Merged into canonical grievance "${canonical.title}" (${canonical._id})`,
          updatedBy: user._id as mongoose.Types.ObjectId,
          updatedAt: new Date(),
        });
        await duplicate.save();

        if (duplicate.authorId) {
          NotificationService.notifyUser({
            userId: duplicate.authorId,
            type: 'issue_merged',
            vars: { issueTitle: duplicate.title },
            data: { issueId: canonical._id, duplicateId: duplicate._id },
            dedupKey: `issue_merged_${duplicate._id}`,
          }).catch((err) => console.warn('[Notification] Failed to notify creator on merge:', err.message));
        }

        if (!canonical.mergedIssueIds) {
          canonical.mergedIssueIds = [];
        }
        canonical.mergedIssueIds.push(duplicate._id as mongoose.Types.ObjectId);
        mergedDuplicates.push(duplicate._id);
      }

      // 4. Update canonical raise count
      canonical.raiseCount = await Raise.countDocuments({ issueId: canonical._id });
      await canonical.save();

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'issue_merged',
        targetType: 'issue',
        targetId: canonical._id,
        details: {
          canonicalIssueId: canonical._id,
          mergedDuplicateIds: mergedDuplicates,
          newRaiseCount: canonical.raiseCount,
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: `Successfully merged ${mergedDuplicates.length} issue(s) into canonical grievance.`,
        canonical: serializeIssue(canonical),
        mergedIds: mergedDuplicates,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unmergeIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Only platform administrators can unmerge grievances.' });
        return;
      }

      const { id } = req.params;
      const duplicate = await Issue.findById(id);
      if (!duplicate) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      if (duplicate.status !== 'merged' || !duplicate.mergedIntoId) {
        res.status(400).json({ success: false, message: 'Issue is not in a merged state.' });
        return;
      }

      // Check 7-day undo window
      if (duplicate.canUnmergeUntil && new Date() > duplicate.canUnmergeUntil) {
        res.status(400).json({
          success: false,
          message: 'The 7-day unmerge undo window for this grievance has expired.',
        });
        return;
      }

      const canonicalId = duplicate.mergedIntoId;
      const canonical = await Issue.findById(canonicalId);

      duplicate.status = 'published';
      duplicate.mergedIntoId = undefined;
      duplicate.mergedAt = undefined;
      duplicate.mergedBy = undefined;
      duplicate.canUnmergeUntil = undefined;
      duplicate.statusTimeline.push({
        status: 'published',
        note: `Unmerged from canonical issue (${canonicalId}) by platform administrator.`,
        updatedBy: new mongoose.Types.ObjectId(req.user.userId),
        updatedAt: new Date(),
      });
      await duplicate.save();

      if (canonical) {
        canonical.mergedIssueIds = (canonical.mergedIssueIds || []).filter(
          (mId) => mId.toString() !== duplicate._id.toString()
        );
        canonical.raiseCount = await Raise.countDocuments({ issueId: canonical._id });
        await canonical.save();
      }

      await AuditService.log({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'issue_unmerged',
        targetType: 'issue',
        targetId: duplicate._id,
        details: { canonicalId, unmergedId: duplicate._id },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Grievance unmerged successfully.',
        issue: serializeIssue(duplicate),
      });
    } catch (err) {
      next(err);
    }
  }

  static async suggestOffice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const Schema = z
        .object({
          coordinates: z.tuple([
            z.number().min(-180).max(180),
            z.number().min(-90).max(90),
          ]),
          category: z.string().min(1),
        })
        .strict();

      const { coordinates, category } = Schema.parse(req.body);
      const result = await OfficeRoutingService.suggestOffice({ coordinates, category });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
