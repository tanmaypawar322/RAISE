import { config } from '../../config/env.js';
import { Subscription } from '../../models/Subscription.js';
import { AuditLog } from '../../models/AuditLog.js';

export class BillingWebhookHandler {
  static async handleSubscriptionEvent(eventType: string, payload: any): Promise<void> {
    const subEntity = payload.payload?.subscription?.entity || payload.subscription || {};
    const providerSubscriptionId = subEntity.id;
    if (!providerSubscriptionId) return;

    const sub = await Subscription.findOne({ providerSubscriptionId });
    if (!sub) return;

    if (
      eventType === 'subscription.authenticated' ||
      eventType === 'subscription.activated' ||
      eventType === 'subscription.charged'
    ) {
      sub.status = 'active';
      if (subEntity.current_end) {
        sub.currentPeriodEnd = new Date(subEntity.current_end * 1000);
      }
      sub.graceUntil = undefined;
      sub.lastPaymentError = undefined;
      await sub.save();

      await AuditLog.create({
        action: 'BILLING_SUBSCRIPTION_ACTIVATED',
        targetType: 'Subscription',
        targetId: sub._id.toString(),
        details: { eventType, providerSubscriptionId, status: 'active' },
      });
    } else if (
      eventType === 'subscription.halted' ||
      eventType === 'payment.failed'
    ) {
      // Payment failure: mark past_due and set safe graceUntil
      const now = new Date();
      const graceUntil = new Date(now.getTime() + config.graceDays * 24 * 60 * 60 * 1000);

      sub.status = 'past_due';
      sub.graceUntil = graceUntil;
      sub.lastPaymentError = 'Charge attempt failed. Grace period active.';
      await sub.save();

      await AuditLog.create({
        action: 'BILLING_PAYMENT_FAILED_PAST_DUE',
        targetType: 'Subscription',
        targetId: sub._id.toString(),
        details: { eventType, providerSubscriptionId, graceUntil },
      });
    } else if (eventType === 'subscription.cancelled') {
      sub.status = 'canceled';
      await sub.save();

      await AuditLog.create({
        action: 'BILLING_SUBSCRIPTION_CANCELED',
        targetType: 'Subscription',
        targetId: sub._id.toString(),
        details: { eventType, providerSubscriptionId },
      });
    }
  }

  static async handlePaymentEvent(eventType: string, payload: any): Promise<void> {
    // If invoice payment captured
    const paymentEntity = payload.payload?.payment?.entity || payload.payment || {};
    const notes = paymentEntity.notes || {};
    const invoiceId = notes.invoiceId;

    if (invoiceId && eventType === 'payment.captured') {
      const { Invoice } = await import('../../models/Invoice.js');
      const invoice = await Invoice.findById(invoiceId);
      if (invoice && invoice.status !== 'paid') {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paymentRef = paymentEntity.id;
        await invoice.save();

        await AuditLog.create({
          action: 'BILLING_INVOICE_PAID_WEBHOOK',
          targetType: 'Invoice',
          targetId: invoice._id.toString(),
          details: { invoiceNumber: invoice.number, paymentId: paymentEntity.id },
        });
      }
    }
  }
}
