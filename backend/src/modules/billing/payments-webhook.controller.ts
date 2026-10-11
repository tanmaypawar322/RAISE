import { Request, Response } from 'express';
import { config } from '../../config/env.js';
import { PaymentService } from '../../services/payment/payment.service.js';
import { WebhookEvent } from '../../models/WebhookEvent.js';

export class PaymentsWebhookController {
  /**
   * Main webhook receiver for Razorpay / Mock payment provider
   * Verifies HMAC signature on raw body, enforces idempotency via WebhookEvent,
   * returns 200 immediately, and asynchronously handles state transitions.
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    // If both billing and donations are disabled, payment endpoints return 404
    if (!config.billingEnabled && !config.donationsEnabled) {
      res.status(404).json({ success: false, message: 'Payment services are not enabled.' });
      return;
    }

    const signature =
      (req.headers['x-razorpay-signature'] as string) ||
      (req.headers['x-payment-signature'] as string) ||
      '';

    const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
    const provider = PaymentService.getProvider();

    // Verify HMAC signature
    const isValid = provider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid payment webhook signature.' });
      return;
    }

    const payload = req.body || {};
    const eventType = payload.event || payload.eventType || 'unknown';
    const providerEventId =
      payload.event_id ||
      payload.id ||
      payload.payload?.payment?.entity?.id ||
      payload.payload?.subscription?.entity?.id ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      // Enforce idempotency: check if event was already recorded
      const existingEvent = await WebhookEvent.findOne({
        provider: provider.providerName,
        providerEventId,
      });

      if (existingEvent && existingEvent.processed) {
        // Already processed successfully — return 200 without duplicate action
        res.status(200).json({ success: true, received: true, idempotentReplay: true });
        return;
      }

      // Record event in WebhookEvent collection
      let webhookRecord = existingEvent;
      if (!webhookRecord) {
        webhookRecord = await WebhookEvent.create({
          provider: provider.providerName,
          providerEventId,
          eventType,
          payload,
          processed: false,
        });
      }

      // Acknowledge provider immediately with 200
      res.status(200).json({ success: true, received: true });

      // Asynchronously process the event
      setImmediate(async () => {
        try {
          await PaymentsWebhookController.processEvent(eventType, payload);
          if (webhookRecord) {
            webhookRecord.processed = true;
            webhookRecord.processedAt = new Date();
            await webhookRecord.save();
          }
        } catch (err: any) {
          if (webhookRecord) {
            webhookRecord.processingError = err.message || String(err);
            await webhookRecord.save();
          }
        }
      });
    } catch (err: any) {
      // In case of duplicate key error on insert (concurrent webhook request)
      if (err.code === 11000) {
        res.status(200).json({ success: true, received: true, concurrentDuplicate: true });
        return;
      }
      res.status(500).json({ success: false, message: 'Error processing webhook event.' });
    }
  }

  /**
   * Dispatches webhook event to appropriate domain handlers
   */
  static async processEvent(eventType: string, payload: any): Promise<void> {
    // Dynamic import to prevent circular dependencies
    const { BillingWebhookHandler } = await import('./billing-webhook.handler.js');
    const { DonationWebhookHandler } = await import('../donations/donation-webhook.handler.js');

    if (eventType.startsWith('subscription.')) {
      await BillingWebhookHandler.handleSubscriptionEvent(eventType, payload);
      await DonationWebhookHandler.handleSubscriptionEvent(eventType, payload);
    } else if (eventType.startsWith('payment.') || eventType.startsWith('order.')) {
      await DonationWebhookHandler.handlePaymentEvent(eventType, payload);
      await BillingWebhookHandler.handlePaymentEvent(eventType, payload);
    }
  }
}
