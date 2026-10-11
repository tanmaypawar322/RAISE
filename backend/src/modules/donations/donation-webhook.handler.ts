import { DonationService } from '../../services/donation.service.js';

export class DonationWebhookHandler {
  static async handleSubscriptionEvent(eventType: string, payload: any): Promise<void> {
    const subEntity = payload.payload?.subscription?.entity || payload.subscription || {};
    const subId = subEntity.id;
    const paymentEntity = payload.payload?.payment?.entity || payload.payment || {};
    const paymentId = paymentEntity.id || `pay_${Date.now()}`;

    if (subId && (eventType === 'subscription.charged' || eventType === 'subscription.activated')) {
      await DonationService.completeDonation(subId, paymentId);
    }
  }

  static async handlePaymentEvent(eventType: string, payload: any): Promise<void> {
    const paymentEntity = payload.payload?.payment?.entity || payload.payment || {};
    const orderId = paymentEntity.order_id || payload.order_id;
    const paymentId = paymentEntity.id || `pay_${Date.now()}`;

    if (orderId && eventType === 'payment.captured') {
      await DonationService.completeDonation(orderId, paymentId);
    }
  }
}
