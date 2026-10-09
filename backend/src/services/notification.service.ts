import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { Raise } from '../models/Raise.js';
import { Notification, INotification, NotificationType } from '../models/Notification.js';
import { NotificationPreference, INotificationPreference } from '../models/NotificationPreference.js';
import { NotificationTemplates, TemplateVariables, SupportedLanguage } from './notification-templates.js';
import { EmailService } from './email/email.service.js';
import { OtpService } from './otp.service.js';
import { EmailUtil } from '../utils/email.util.js';
import { decryptPhone } from '../utils/crypto.util.js';
import { config } from '../config/env.js';

export const ESSENTIAL_EVENTS: NotificationType[] = [
  'issue_resolved_pending_confirmation',
  'issue_disputed',
  'office_sla_breached',
  'office_new_assignment',
  'office_escalation_received',
];

export const SMS_ELIGIBLE_EVENTS: NotificationType[] = [
  'issue_acknowledged',
  'issue_resolved_pending_confirmation',
  'issue_disputed',
];

export interface NotifyUserParams {
  userId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  vars?: TemplateVariables;
  data?: Record<string, any>;
  dedupKey?: string;
  now?: Date;
}

export class NotificationService {
  /**
   * Evaluates if a given timestamp falls within Indian Standard Time (IST) Quiet Hours (21:00 to 08:00 IST).
   * IST is UTC + 5:30 (330 minutes).
   */
  static isQuietHours(date: Date = new Date()): boolean {
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const istTotalMinutes = (utcHours * 60 + utcMinutes + 330) % 1440;
    const istHour = Math.floor(istTotalMinutes / 60);

    // 21:00 (9 PM) to 08:00 (8 AM) IST
    return istHour >= 21 || istHour < 8;
  }

  /**
   * Retrieves or creates default notification preferences for a user.
   */
  static async getOrCreatePreferences(userId: mongoose.Types.ObjectId | string, defaultLang: SupportedLanguage = 'en'): Promise<INotificationPreference> {
    let pref = await NotificationPreference.findOne({ userId });
    if (!pref) {
      pref = await NotificationPreference.create({
        userId,
        channels: {
          inApp: true,
          sms: true,
          email: true,
          whatsapp: false,
        },
        quietHoursEnabled: true,
        optOutEvents: [],
        preferredLanguage: defaultLang,
      });
    }
    return pref;
  }

  /**
   * Core notification dispatcher for a single user.
   * Handles templating, deduplication, quiet hours suppression, and zero-PII SMS delivery.
   */
  static async notifyUser(params: NotifyUserParams): Promise<INotification | null> {
    if (config.notificationsEnabled === false) {
      return null;
    }

    const { userId, type, vars = {}, data = {}, dedupKey, now = new Date() } = params;

    // 1. 15-Minute Deduplication Check
    if (dedupKey) {
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const existing = await Notification.findOne({
        userId,
        dedupKey,
        createdAt: { $gte: fifteenMinutesAgo },
      });
      if (existing) {
        return null; // Suppressed duplicate
      }
    }

    // 2. Fetch User & Preferences
    const user = await User.findById(userId);
    if (!user || user.status === 'deleted') {
      return null;
    }

    const defaultLang = (user.language as SupportedLanguage) || 'en';
    const pref = await this.getOrCreatePreferences(user._id as mongoose.Types.ObjectId, defaultLang);

    // 3. Opt-out validation (essential civic events cannot be opted out of)
    const isEssential = ESSENTIAL_EVENTS.includes(type);
    if (!isEssential && pref.optOutEvents?.includes(type)) {
      return null;
    }

    // 4. Render localized template
    const lang: SupportedLanguage = pref.preferredLanguage || defaultLang;
    const template = NotificationTemplates.render(type, lang, vars);

    const channelDelivered: string[] = [];

    // 5. In-App Notification (always delivered immediately unless explicitly disabled for non-essential events)
    const deliverInApp = isEssential || pref.channels.inApp !== false;
    if (deliverInApp) {
      channelDelivered.push('in_app');
    }

    // 6. SMS Channel Check
    const isSmsEligible = SMS_ELIGIBLE_EVENTS.includes(type);
    const smsAllowedByPref = pref.channels.sms !== false;
    const inQuietHours = pref.quietHoursEnabled && this.isQuietHours(now);

    if (isSmsEligible && smsAllowedByPref && !inQuietHours && template.smsText) {
      // Check Daily SMS Cap
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const dailySmsSent = await Notification.countDocuments({
        userId: user._id,
        channelDelivered: 'sms',
        createdAt: { $gte: startOfDay },
      });

      const smsCap = config.smsDailyCap || 5;
      if (dailySmsSent < smsCap) {
        let phone: string | null = null;
        if (user.phoneEnc) {
          try {
            phone = decryptPhone(user.phoneEnc, config.phoneEncryptionKey);
          } catch {
            phone = null;
          }
        }

        if (phone) {
          try {
            const smsProvider = OtpService.getProvider();
            if (smsProvider.sendSms) {
              await smsProvider.sendSms(phone, template.smsText);
            }
            channelDelivered.push('sms');
          } catch (err: any) {
            console.warn(`[NotificationService] SMS delivery failed for user ${user._id}: ${err.message}`);
          }
        }
      }
    }

    // 7. Email Channel Check
    // CRITICAL DPDP/PILOT RULE: Never send notifications to unverified email addresses!
    const emailAllowedByPref = pref.channels.email !== false;
    if (emailAllowedByPref && user.emailVerified === true) {
      let email: string | null = user.email || null;
      if (!email && user.emailEnc) {
        try {
          email = EmailUtil.decrypt(user.emailEnc, config.emailEncryptionKey);
        } catch {
          email = null;
        }
      }

      if (email) {
        try {
          await EmailService.sendNotificationEmail(email, template.title, template.body, lang);
          channelDelivered.push('email');
        } catch (err: any) {
          console.warn(`[NotificationService] Email delivery failed for user ${user._id}: ${err.message}`);
        }
      }
    }

    // 8. Save In-App Notification Record
    if (deliverInApp || channelDelivered.length > 0) {
      const doc = await Notification.create({
        userId: user._id,
        type,
        title: template.title,
        body: template.body,
        data,
        read: false,
        channelDelivered,
        dedupKey,
      });
      return doc;
    }

    return null;
  }

  /**
   * Broadcasts notification to all active officials assigned to a specific office.
   */
  static async notifyOfficeMembers(
    officeId: mongoose.Types.ObjectId | string,
    type: NotificationType,
    vars: TemplateVariables = {},
    data: Record<string, any> = {},
    dedupKeyPrefix?: string
  ): Promise<INotification[]> {
    const members = await User.find({
      $or: [
        { 'officeMemberships.officeId': officeId, 'officeMemberships.status': 'active' },
        { officialOfficeId: officeId, isOfficialVerified: true },
      ],
      status: 'active',
    });

    const results: INotification[] = [];
    for (const member of members) {
      const dedupKey = dedupKeyPrefix ? `${dedupKeyPrefix}_${member._id}` : undefined;
      const notif = await this.notifyUser({
        userId: member._id as mongoose.Types.ObjectId,
        type,
        vars,
        data: { ...data, officeId },
        dedupKey,
      });
      if (notif) {
        results.push(notif);
      }
    }

    return results;
  }

  /**
   * Broadcasts notification to all citizens who supported ('raised') a civic grievance.
   */
  static async notifyIssueSupporters(
    issueId: mongoose.Types.ObjectId | string,
    type: NotificationType,
    vars: TemplateVariables = {},
    data: Record<string, any> = {},
    excludeUserId?: mongoose.Types.ObjectId | string
  ): Promise<INotification[]> {
    const raises = await Raise.find({ issueId }).select('userId');
    const results: INotification[] = [];

    for (const raise of raises) {
      if (excludeUserId && raise.userId.toString() === excludeUserId.toString()) {
        continue;
      }

      const notif = await this.notifyUser({
        userId: raise.userId,
        type,
        vars,
        data: { ...data, issueId },
        dedupKey: `${type}_${issueId}_${raise.userId}`,
      });
      if (notif) {
        results.push(notif);
      }
    }

    return results;
  }
}
