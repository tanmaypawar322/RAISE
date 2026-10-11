import crypto from 'crypto';
import {
  IPaymentProvider,
  CreateOrderParams,
  OrderResult,
  CreateSubscriptionParams,
  SubscriptionResult,
  FetchPaymentResult,
  RefundResult,
} from './payment-provider.interface.js';

export class MockPaymentProvider implements IPaymentProvider {
  readonly providerName = 'mock' as const;

  private mockPayments = new Map<string, FetchPaymentResult>();

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const providerOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      providerOrderId,
      amountPaise: params.amountPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      status: 'created',
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const providerSubscriptionId = `sub_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      providerSubscriptionId,
      status: 'created',
      currentStart: now,
      currentEnd: oneMonthLater,
      shortUrl: `https://mock.checkout.raise.org/sub/${providerSubscriptionId}`,
    };
  }

  async cancelSubscription(
    providerSubscriptionId: string,
    atCycleEnd: boolean = true
  ): Promise<{ success: boolean; status: string }> {
    return {
      success: true,
      status: atCycleEnd ? 'canceling' : 'canceled',
    };
  }

  async fetchPayment(providerPaymentId: string): Promise<FetchPaymentResult> {
    const existing = this.mockPayments.get(providerPaymentId);
    if (existing) return existing;

    // Default mock response: captured payment
    return {
      providerPaymentId,
      amountPaise: 100000,
      currency: 'INR',
      status: 'captured',
      orderId: `order_mock_ref`,
      method: 'upi',
      email: 'citizen@example.com',
      contact: '+919876543210',
      isInternational: false,
      capturedAt: new Date(),
    };
  }

  async refund(
    providerPaymentId: string,
    amountPaise?: number,
    notes?: Record<string, string>
  ): Promise<RefundResult> {
    const providerRefundId = `rfnd_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      providerRefundId,
      amountPaise: amountPaise || 100000,
      status: 'processed',
    };
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret?: string): boolean {
    if (!signature) return false;
    // Test mode bypass for unit tests
    if (signature === 'valid_test_signature' || signature === 'valid_mock_sig') {
      return true;
    }

    const testSecret = secret || 'mock_webhook_secret';
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', testSecret)
      .update(bodyStr)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  // Helper for test setups to pre-register expected payment responses
  setMockPayment(paymentId: string, payment: FetchPaymentResult) {
    this.mockPayments.set(paymentId, payment);
  }
}
