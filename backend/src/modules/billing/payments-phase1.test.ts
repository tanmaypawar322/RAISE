import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatInr, paiseToRupees, rupeesToPaise, getFinancialYear } from '../../utils/money.js';
import { MockPaymentProvider } from '../../services/payment/mock.provider.js';
import { FinancialSequenceService } from '../../services/financial-sequence.service.js';
import { FinancialSequence } from '../../models/FinancialSequence.js';
import { WebhookEvent } from '../../models/WebhookEvent.js';
import { PaymentsWebhookController } from './payments-webhook.controller.js';
import { config } from '../../config/env.js';

describe('Phase 1 Foundations: Money Helpers, FY & Payment Provider Abstraction', () => {
  describe('1. Money and Indian Number Formatting', () => {
    it('formats integer paise correctly into standard Indian comma grouping (lakhs & crores)', () => {
      assert.equal(formatInr(100), '₹1');
      assert.equal(formatInr(5000), '₹50');
      assert.equal(formatInr(100000), '₹1,000');
      assert.equal(formatInr(10000000), '₹1,00,000');
      assert.equal(formatInr(1000000000), '₹1,00,00,000');
      assert.equal(formatInr(1050), '₹10.50');
    });

    it('converts correctly between rupees and integer paise', () => {
      assert.equal(rupeesToPaise(100), 10000);
      assert.equal(rupeesToPaise(50.25), 5025);
      assert.equal(paiseToRupees(10000), 100);
      assert.equal(paiseToRupees(5025), 50.25);
    });

    it('computes Indian financial year (April-March) accurately', () => {
      const may2026 = new Date('2026-05-15');
      const jan2027 = new Date('2027-01-20');
      const march2027 = new Date('2027-03-31');
      const april2027 = new Date('2027-04-01');

      assert.equal(getFinancialYear(may2026), '2026-27');
      assert.equal(getFinancialYear(jan2027), '2026-27');
      assert.equal(getFinancialYear(march2027), '2026-27');
      assert.equal(getFinancialYear(april2027), '2027-28');
    });
  });

  describe('2. Concurrency-Safe Financial Sequence Generator', () => {
    it('generates zero-padded, sequential invoice and donation identifiers', async () => {
      const originalFindOneAndUpdate = FinancialSequence.findOneAndUpdate;
      let counter = 0;

      try {
        FinancialSequence.findOneAndUpdate = (async (_query: any, update: any) => {
          counter += update.$inc.lastSequence;
          return { lastSequence: counter };
        }) as any;

        const inv1 = await FinancialSequenceService.getNextSequence('INV', new Date('2026-06-01'));
        const inv2 = await FinancialSequenceService.getNextSequence('INV', new Date('2026-06-01'));
        const don1 = await FinancialSequenceService.getNextSequence('DON', new Date('2026-06-01'));

        assert.equal(inv1, 'RAISE/INV/2026-27/000001');
        assert.equal(inv2, 'RAISE/INV/2026-27/000002');
        assert.equal(don1, 'RAISE/DON/2026-27/000003');
      } finally {
        FinancialSequence.findOneAndUpdate = originalFindOneAndUpdate;
      }
    });
  });

  describe('3. Payment Provider Abstraction & Webhook Verification', () => {
    const mockProvider = new MockPaymentProvider();

    it('creates orders and subscriptions returning standard shapes', async () => {
      const order = await mockProvider.createOrder({
        amountPaise: 50000,
        currency: 'INR',
        receipt: 'RAISE/TEST/001',
      });
      assert.ok(order.providerOrderId.startsWith('order_mock_'));
      assert.equal(order.amountPaise, 50000);
      assert.equal(order.status, 'created');

      const sub = await mockProvider.createSubscription({
        planKey: 'office_pro',
      });
      assert.ok(sub.providerSubscriptionId.startsWith('sub_mock_'));
      assert.equal(sub.status, 'created');
    });

    it('verifies valid HMAC webhook signature and rejects invalid signatures', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured' });
      assert.equal(mockProvider.verifyWebhookSignature(rawBody, 'valid_test_signature'), true);
      assert.equal(mockProvider.verifyWebhookSignature(rawBody, 'invalid_sig'), false);
      assert.equal(mockProvider.verifyWebhookSignature(rawBody, ''), false);
    });

    it('returns 404 on payment webhook when both BILLING_ENABLED and DONATIONS_ENABLED are false', async () => {
      const prevBilling = config.billingEnabled;
      const prevDonations = config.donationsEnabled;

      (config as any).billingEnabled = false;
      (config as any).donationsEnabled = false;

      let statusCode = 0;
      let jsonBody: any = null;
      const mockReq: any = { headers: {}, body: {} };
      const mockRes: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          jsonBody = data;
          return this;
        },
      };

      try {
        await PaymentsWebhookController.handleWebhook(mockReq, mockRes);
        assert.equal(statusCode, 404, 'Must return 404 when payment features are disabled');
      } finally {
        (config as any).billingEnabled = prevBilling;
        (config as any).donationsEnabled = prevDonations;
      }
    });

    it('rejects unverified webhook signatures with 400 when enabled', async () => {
      const prevBilling = config.billingEnabled;
      (config as any).billingEnabled = true;

      let statusCode = 0;
      const mockReq: any = {
        headers: { 'x-razorpay-signature': 'tampered_signature' },
        body: { event: 'payment.captured' },
      };
      const mockRes: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json() {
          return this;
        },
      };

      try {
        await PaymentsWebhookController.handleWebhook(mockReq, mockRes);
        assert.equal(statusCode, 400, 'Must reject invalid signature with 400');
      } finally {
        (config as any).billingEnabled = prevBilling;
      }
    });

    it('handles idempotent replays by returning 200 without duplicate execution', async () => {
      const prevBilling = config.billingEnabled;
      (config as any).billingEnabled = true;

      const originalFindOne = WebhookEvent.findOne;
      try {
        WebhookEvent.findOne = (async () => ({
          provider: 'mock',
          providerEventId: 'evt_test_123',
          processed: true,
        })) as any;

        let statusCode = 0;
        let responsePayload: any = null;
        const mockReq: any = {
          headers: { 'x-razorpay-signature': 'valid_test_signature' },
          body: { event_id: 'evt_test_123', event: 'payment.captured' },
        };
        const mockRes: any = {
          status(code: number) {
            statusCode = code;
            return this;
          },
          json(data: any) {
            responsePayload = data;
            return this;
          },
        };

        await PaymentsWebhookController.handleWebhook(mockReq, mockRes);
        assert.equal(statusCode, 200);
        assert.equal(responsePayload?.idempotentReplay, true, 'Replayed event must be acknowledged with idempotentReplay flag');
      } finally {
        WebhookEvent.findOne = originalFindOne;
        (config as any).billingEnabled = prevBilling;
      }
    });
  });
});
