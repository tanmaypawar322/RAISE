import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { Subscription, ISubscription } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { User } from '../models/User.js';
import { Office } from '../models/Office.js';
import { PaymentService } from './payment/payment.service.js';
import { InvoiceService } from './invoice.service.js';
import { AuditLog } from '../models/AuditLog.js';

export class SubscriptionService {
  /**
   * Enforces seat limit against active approved office members
   */
  static async checkSeatLimit(officeId: string | mongoose.Types.ObjectId): Promise<{ allowed: boolean; currentMembers: number; seatLimit: number }> {
    const sub = await Subscription.findOne({
      officeId: new mongoose.Types.ObjectId(officeId),
      status: { $in: ['active', 'trialing', 'past_due'] },
    }).sort({ createdAt: -1 });

    let seatLimit = sub?.seats;
    if (seatLimit === undefined || seatLimit === null) {
      const plan = await Plan.findOne({ key: sub?.planKey || 'office_basic' });
      seatLimit = plan?.limits?.seats || 5;
    }

    // Count approved active members in this office
    const activeMembersCount = await User.countDocuments({
      'officeMemberships': {
        $elemMatch: {
          officeId: new mongoose.Types.ObjectId(officeId),
          status: 'active',
        },
      },
    });

    return {
      allowed: activeMembersCount < seatLimit,
      currentMembers: activeMembersCount,
      seatLimit,
    };
  }

  /**
   * Creates or updates a self-serve subscription with the payment provider
   */
  static async createSelfServeCheckout(
    officeId: string | mongoose.Types.ObjectId,
    planKey: string,
    interval: 'monthly' | 'yearly' = 'monthly',
    userId?: string | mongoose.Types.ObjectId
  ): Promise<{ subscription: ISubscription; checkoutUrl?: string; providerSubscriptionId: string }> {
    const office = await Office.findById(officeId);
    if (!office) throw new Error('Office not found.');

    const plan = await Plan.findOne({ key: planKey, isActive: true });
    if (!plan) throw new Error(`Plan ${planKey} not found or inactive.`);

    const provider = PaymentService.getProvider();
    const providerSub = await provider.createSubscription({
      planKey,
      customerNotify: true,
      notes: {
        officeId: office._id.toString(),
        officeName: office.name,
      },
    });

    const now = new Date();
    const periodEnd = new Date(
      interval === 'yearly'
        ? now.getTime() + 365 * 24 * 60 * 60 * 1000
        : now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const subscription = await Subscription.create({
      officeId: office._id,
      planKey,
      status: 'trialing', // transitions to active upon verified webhook
      billingMode: 'self_serve',
      interval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      seats: plan.limits.seats,
      provider: provider.providerName,
      providerSubscriptionId: providerSub.providerSubscriptionId,
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    await AuditLog.create({
      actorId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      actorRole: 'official',
      action: 'BILLING_CHECKOUT_INITIATED',
      targetType: 'Subscription',
      targetId: subscription._id.toString(),
      details: { officeId: office._id.toString(), planKey, interval },
    });

    return {
      subscription,
      checkoutUrl: providerSub.shortUrl,
      providerSubscriptionId: providerSub.providerSubscriptionId,
    };
  }

  /**
   * Admin-initiated Invoice-mode subscription (standard for government departments & municipal corporations)
   */
  static async createInvoiceModeSubscription(
    adminUserId: string | mongoose.Types.ObjectId,
    params: {
      officeId: string;
      planKey: string;
      interval?: 'monthly' | 'yearly';
      seats?: number;
      buyerName: string;
      buyerGstin?: string;
      buyerAddress?: string;
      buyerEmail?: string;
      placeOfSupply: string;
    }
  ): Promise<{ subscription: ISubscription; invoice: any }> {
    const office = await Office.findById(params.officeId);
    if (!office) throw new Error('Office not found.');

    const plan = await Plan.findOne({ key: params.planKey, isActive: true });
    if (!plan) throw new Error('Plan not found.');

    const now = new Date();
    const interval = params.interval || 'yearly';
    const periodEnd = new Date(
      interval === 'yearly'
        ? now.getTime() + 365 * 24 * 60 * 60 * 1000
        : now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const unitPricePaise =
      interval === 'yearly' ? plan.priceYearlyPaise : plan.priceMonthlyPaise;

    const subscription = await Subscription.create({
      officeId: office._id,
      planKey: params.planKey,
      status: 'active',
      billingMode: 'invoice',
      interval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      seats: params.seats || plan.limits.seats,
      provider: 'manual_invoice',
      createdBy: new mongoose.Types.ObjectId(adminUserId),
    });

    const invoice = await InvoiceService.createInvoice({
      officeId: office._id,
      subscriptionId: subscription._id,
      buyerName: params.buyerName,
      buyerGstin: params.buyerGstin,
      buyerAddress: params.buyerAddress,
      buyerEmail: params.buyerEmail,
      placeOfSupply: params.placeOfSupply,
      lineItems: [
        {
          description: `RAISE ${plan.name} Subscription (${interval}) - ${office.name}`,
          quantity: 1,
          unitPricePaise,
        },
      ],
      status: 'issued',
    });

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUserId),
      actorRole: 'admin',
      action: 'ADMIN_SUBSCRIPTION_INVOICE_CREATED',
      targetType: 'Subscription',
      targetId: subscription._id.toString(),
      details: {
        officeId: office._id.toString(),
        invoiceNumber: invoice.number,
        totalPaise: invoice.totalPaise,
      },
    });

    return { subscription, invoice };
  }

  /**
   * Safely downgrades lapsed subscriptions beyond their grace period.
   * NON-NEGOTIABLE RULE 4:
   * When downgraded, all public records, scorecards and past responses remain 100% intact.
   * The office can ALWAYS export its own data.
   */
  static async checkAndProcessLapsedSubscriptions(): Promise<number> {
    const now = new Date();

    const lapsedSubscriptions = await Subscription.find({
      status: 'past_due',
      graceUntil: { $lt: now },
    });

    for (const sub of lapsedSubscriptions) {
      sub.status = 'expired';
      await sub.save();

      await AuditLog.create({
        action: 'SUBSCRIPTION_LAPSE_DOWNGRADE_BASIC',
        targetType: 'Subscription',
        targetId: sub._id.toString(),
        details: {
          officeId: sub.officeId.toString(),
          reason: 'Grace period expired without successful renewal payment.',
          rule4Enforced: 'Downgraded to office_basic. Public history & scorecard intact. Export permitted.',
        },
      });
    }

    return lapsedSubscriptions.length;
  }
}
