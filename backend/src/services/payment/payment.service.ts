import { config } from '../../config/env.js';
import { IPaymentProvider } from './payment-provider.interface.js';
import { RazorpayProvider } from './razorpay.provider.js';
import { MockPaymentProvider } from './mock.provider.js';

export class PaymentService {
  private static instance: IPaymentProvider | null = null;

  static getProvider(): IPaymentProvider {
    if (this.instance) return this.instance;

    if (config.paymentProvider === 'razorpay') {
      this.instance = new RazorpayProvider();
    } else {
      this.instance = new MockPaymentProvider();
    }

    return this.instance;
  }

  // Allow test suites to override or inject a mock provider
  static setProvider(provider: IPaymentProvider | null): void {
    this.instance = provider;
  }
}
