import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Notification } from '../../models/Notification.js';
import { NotificationPreference } from '../../models/NotificationPreference.js';
import { NotificationService, ESSENTIAL_EVENTS } from '../../services/notification.service.js';

const UpdatePreferencesSchema = z.object({
  channels: z
    .object({
      inApp: z.boolean().optional(),
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
    })
    .optional(),
  quietHoursEnabled: z.boolean().optional(),
  optOutEvents: z.array(z.string()).optional(),
  preferredLanguage: z.enum(['en', 'mr', 'hi']).optional(),
});

export class NotificationsController {
  /**
   * Retrieves paginated notifications and total unread count for current user.
   */
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const unreadOnly = req.query.unreadOnly === 'true';

      const filter: Record<string, any> = { userId };
      if (unreadOnly) {
        filter.read = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, read: false }),
      ]);

      res.json({
        success: true,
        notifications,
        unreadCount,
        total,
        page,
        limit,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Marks a specific notification as read.
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ success: false, message: 'Invalid notification ID' });
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const notif = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { $set: { read: true, readAt: new Date() } },
        { new: true }
      );

      if (!notif) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      const unreadCount = await Notification.countDocuments({ userId, read: false });

      res.json({
        success: true,
        notification: notif,
        unreadCount,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Marks all notifications for current user as read.
   */
  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const result = await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount,
        unreadCount: 0,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Returns current notification preferences for authenticated user.
   */
  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const preferences = await NotificationService.getOrCreatePreferences(userId);

      res.json({
        success: true,
        preferences,
        essentialEvents: ESSENTIAL_EVENTS,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates notification channels, quiet hours, and event opt-outs.
   * Strips any essential events from opt-outs.
   */
  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const parsed = UpdatePreferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid preferences payload',
          errors: parsed.error.issues,
        });
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const data = parsed.data;

      // Ensure essential events cannot be opted out of
      let sanitizedOptOuts: string[] | undefined = undefined;
      if (data.optOutEvents) {
        sanitizedOptOuts = data.optOutEvents.filter(
          (e) => !ESSENTIAL_EVENTS.includes(e as any)
        );
      }

      let pref = await NotificationService.getOrCreatePreferences(userId);

      if (data.channels) {
        pref.channels = {
          ...pref.channels,
          ...data.channels,
        };
      }

      if (typeof data.quietHoursEnabled === 'boolean') {
        pref.quietHoursEnabled = data.quietHoursEnabled;
      }

      if (sanitizedOptOuts !== undefined) {
        pref.optOutEvents = sanitizedOptOuts;
      }

      if (data.preferredLanguage) {
        pref.preferredLanguage = data.preferredLanguage;
      }

      await pref.save();

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: pref,
        essentialEvents: ESSENTIAL_EVENTS,
      });
    } catch (err) {
      next(err);
    }
  }
}
