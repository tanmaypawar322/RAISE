import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Subscription, ISubscription } from '../models/Subscription.js';
import { Plan, IPlan } from '../models/Plan.js';
import { UsageCounter, UsageKey } from '../models/UsageCounter.js';

export const BASIC_FEATURES = [
  'public_reporting',
  'claim_profile',
  'respond_issues',
  'update_status',
  'public_notes',
  'publish_reports',
  'export_own_data', // Rule 4: Data export is ALWAYS allowed, even on Basic or lapsed
];

export const DEFAULT_BASIC_LIMITS = {
  seats: 5,
  exportsPerMonth: 10,
  notificationCredits: 50,
};

export class EntitlementsService {
  /**
   * Resolves the active plan for an office.
   * If subscription is active or within graceUntil, grants the plan's features.
   * Otherwise resolves to office_basic.
   */
  static async resolveOfficePlan(
    officeId: string | mongoose.Types.ObjectId
  ): Promise<{ plan: IPlan | null; planKey: string; subscription: ISubscription | null }> {
    const now = new Date();

    // Find the latest subscription for this office
    const sub = await Subscription.findOne({
      officeId: new mongoose.Types.ObjectId(officeId),
    }).sort({ createdAt: -1 });

    if (sub) {
      const isPeriodValid = sub.currentPeriodEnd && sub.currentPeriodEnd > now;
      const isGraceValid = sub.graceUntil && sub.graceUntil > now;

      if (sub.status === 'active' || (sub.status === 'past_due' && isGraceValid)) {
        const plan = await Plan.findOne({ key: sub.planKey, isActive: true });
        if (plan) {
          return { plan, planKey: sub.planKey, subscription: sub };
        }
      }
    }

    // Default resolution: office_basic
    const basicPlan = await Plan.findOne({ key: 'office_basic' });
    return { plan: basicPlan, planKey: 'office_basic', subscription: null };
  }

  /**
   * Checks whether an office is entitled to a specific feature key.
   * Basic features are ALWAYS allowed for all offices.
   */
  static async can(
    officeId: string | mongoose.Types.ObjectId,
    featureKey: string
  ): Promise<boolean> {
    // Non-negotiable rule 3: Basic tier features are always permitted
    if (BASIC_FEATURES.includes(featureKey)) {
      return true;
    }

    const { plan } = await this.resolveOfficePlan(officeId);
    if (!plan) return false;

    return (plan.features || []).includes(featureKey);
  }

  /**
   * Returns the numeric limit for a key (seats, exportsPerMonth, notificationCredits)
   */
  static async limit(
    officeId: string | mongoose.Types.ObjectId,
    limitKey: 'seats' | 'exportsPerMonth' | 'notificationCredits'
  ): Promise<number> {
    const { plan, subscription } = await this.resolveOfficePlan(officeId);
    if (subscription && limitKey === 'seats' && subscription.seats) {
      return subscription.seats;
    }
    if (plan && plan.limits && plan.limits[limitKey] !== undefined) {
      return plan.limits[limitKey];
    }
    return DEFAULT_BASIC_LIMITS[limitKey] || 0;
  }

  /**
   * Atomically records usage against a monthly limit.
   * Period format: YYYY-MM
   */
  static async incrementUsage(
    officeId: string | mongoose.Types.ObjectId,
    key: UsageKey,
    increment: number = 1
  ): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let limitKey: 'exportsPerMonth' | 'notificationCredits' = 'exportsPerMonth';
    if (key === 'notifications') limitKey = 'notificationCredits';

    const limitVal = await this.limit(officeId, limitKey);
    const { subscription } = await this.resolveOfficePlan(officeId);
    const subId = subscription?._id || new mongoose.Types.ObjectId('000000000000000000000000');

    // Atomic increment
    const counter = await UsageCounter.findOneAndUpdate(
      {
        officeId: new mongoose.Types.ObjectId(officeId),
        key,
        period,
      },
      {
        $inc: { used: increment },
        $setOnInsert: { subscriptionId: subId, limit: limitVal },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const allowed = counter.used <= limitVal;
    const remaining = Math.max(0, limitVal - counter.used);

    return {
      allowed,
      used: counter.used,
      limit: limitVal,
      remaining,
    };
  }
}

/**
 * Express middleware to gate endpoints strictly via EntitlementsService
 */
export function requireEntitlement(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // If it's a basic feature, pass immediately without checking
    if (BASIC_FEATURES.includes(featureKey)) {
      next();
      return;
    }

    const officeId =
      req.params.officeId ||
      req.body.officeId ||
      req.user?.officialOfficeId ||
      req.user?.officeMemberships?.[0]?.officeId;

    if (!officeId) {
      res.status(400).json({ success: false, message: 'Office ID context required for entitlement check.' });
      return;
    }

    const allowed = await EntitlementsService.can(officeId, featureKey);
    if (!allowed) {
      res.status(403).json({
        success: false,
        code: 'UPGRADE_REQUIRED',
        message: `This feature (${featureKey}) is available on an upgraded office plan.`,
      });
      return;
    }

    next();
  };
}
