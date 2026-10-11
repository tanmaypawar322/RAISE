import crypto from 'crypto';
import { config } from '../../config/env.js';
import {
  IPaymentProvider,
  CreateOrderParams,
  OrderResult,
  CreateSubscriptionParams,
  SubscriptionResult,
  FetchPaymentResult,
  RefundResult,
} from './payment-provider.interface.js';

export class RazorpayProvider implements IPaymentProvider {
  readonly providerName = 'razorpay' as const;

  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private baseUrl = 'https://api.razorpay.com/v1';

  constructor(keyId?: string, keySecret?: string, webhookSecret?: string) {
    this.keyId = keyId || config.razorpayKeyId;
    this.keySecret = keySecret || config.razorpayKeySecret;
    this.webhookSecret = webhookSecret || config.razorpayWebhookSecret;
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay createOrder failed (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    return {
      providerOrderId: data.id,
      amountPaise: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      status: data.status,
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const payload: any = {
      plan_id: params.providerPlanId,
      total_count: params.totalCount || 120, // default 10 years monthly
      quantity: 1,
      customer_notify: params.customerNotify ? 1 : 0,
      notes: params.notes,
    };

    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay createSubscription failed (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    return {
      providerSubscriptionId: data.id,
      status: data.status,
      currentStart: data.current_start ? new Date(data.current_start * 1000) : undefined,
      currentEnd: data.current_end ? new Date(data.current_end * 1000) : undefined,
      shortUrl: data.short_url,
    };
  }

  async cancelSubscription(
    providerSubscriptionId: string,
    atCycleEnd: boolean = true
  ): Promise<{ success: boolean; status: string }> {
    const response = await fetch(`${this.baseUrl}/subscriptions/${providerSubscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify({
        cancel_at_cycle_end: atCycleEnd ? 1 : 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay cancelSubscription failed (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    return {
      success: true,
      status: data.status,
    };
  }

  async fetchPayment(providerPaymentId: string): Promise<FetchPaymentResult> {
    const response = await fetch(`${this.baseUrl}/payments/${providerPaymentId}`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay fetchPayment failed (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    const isInternational = data.international === true;

    return {
      providerPaymentId: data.id,
      amountPaise: data.amount,
      currency: data.currency,
      status: data.status === 'captured' ? 'captured' : data.status === 'refunded' ? 'refunded' : 'failed',
      orderId: data.order_id,
      method: data.method,
      email: data.email,
      contact: data.contact,
      isInternational,
      capturedAt: data.created_at ? new Date(data.created_at * 1000) : undefined,
    };
  }

  async refund(
    providerPaymentId: string,
    amountPaise?: number,
    notes?: Record<string, string>
  ): Promise<RefundResult> {
    const payload: any = { notes };
    if (amountPaise) payload.amount = amountPaise;

    const response = await fetch(`${this.baseUrl}/payments/${providerPaymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay refund failed (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    return {
      providerRefundId: data.id,
      amountPaise: data.amount,
      status: data.status,
    };
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret?: string): boolean {
    if (!signature) return false;
    const webhookSecret = secret || this.webhookSecret;
    if (!webhookSecret) return false;

    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
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
}
