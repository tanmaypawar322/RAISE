export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface OrderResult {
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface CreateSubscriptionParams {
  planKey: string;
  providerPlanId?: string;
  totalCount?: number;
  customerNotify?: boolean;
  notes?: Record<string, string>;
}

export interface SubscriptionResult {
  providerSubscriptionId: string;
  status: string;
  currentStart?: Date;
  currentEnd?: Date;
  shortUrl?: string;
}

export interface FetchPaymentResult {
  providerPaymentId: string;
  amountPaise: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  orderId?: string;
  method?: string;
  email?: string;
  contact?: string;
  isInternational?: boolean;
  capturedAt?: Date;
}

export interface RefundResult {
  providerRefundId: string;
  amountPaise: number;
  status: string;
}

export interface IPaymentProvider {
  readonly providerName: 'razorpay' | 'mock';

  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
  cancelSubscription(providerSubscriptionId: string, atCycleEnd?: boolean): Promise<{ success: boolean; status: string }>;
  fetchPayment(providerPaymentId: string): Promise<FetchPaymentResult>;
  refund(providerPaymentId: string, amountPaise?: number, notes?: Record<string, string>): Promise<RefundResult>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret?: string): boolean;
}
