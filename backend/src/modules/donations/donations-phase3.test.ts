import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { DonationService, CreateDonationSchema } from '../../services/donation.service.js';
import { Donation } from '../../models/Donation.js';
import { DonorSubscription } from '../../models/DonorSubscription.js';
import { FinancialSequence } from '../../models/FinancialSequence.js';
import { AuditLog } from '../../models/AuditLog.js';
import { encryptPan, decryptPan, maskPan } from '../../utils/pan-crypto.js';
import { config } from '../../config/env.js';

describe('Phase 3: Citizen Donations & Monthly Recurring Supporters', () => {
  describe('1. Zod Validation & Mandatory Civic Neutrality Declarations', () => {
    it('rejects donations below minimum threshold (₹10 / 1000 paise)', () => {
      const result = CreateDonationSchema.safeParse({
        donorEmail: 'citizen@example.com',
        amountPaise: 500, // ₹5
        declarations: {
          notPoliticalEntity: true,
          notForeign: true,
        },
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error.errors[0].message, /Minimum donation/);
      }
    });

    it('rejects donations exceeding online maximum threshold', () => {
      const result = CreateDonationSchema.safeParse({
        donorEmail: 'citizen@example.com',
        amountPaise: 100000001, // > ₹10,00,000
        declarations: {
          notPoliticalEntity: true,
          notForeign: true,
        },
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error.errors[0].message, /Maximum online donation/);
      }
    });

    it('fails if non-political declaration is omitted or false', () => {
      const result = CreateDonationSchema.safeParse({
        donorEmail: 'citizen@example.com',
        amountPaise: 10000,
        declarations: {
          notPoliticalEntity: false,
          notForeign: true,
        },
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(
          result.error.errors[0].message,
          /You must declare that you are not donating on behalf of a political entity/
        );
      }
    });

    it('fails if non-foreign (FCRA compliance) declaration is omitted or false', () => {
      const result = CreateDonationSchema.safeParse({
        donorEmail: 'citizen@example.com',
        amountPaise: 10000,
        declarations: {
          notPoliticalEntity: true,
          notForeign: false,
        },
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(
          result.error.errors[0].message,
          /foreign funds cannot be accepted/
        );
      }
    });

    it('validates standard Indian PAN format (5 uppercase letters, 4 digits, 1 letter)', () => {
      const valid = CreateDonationSchema.safeParse({
        donorEmail: 'citizen@example.com',
        amountPaise: 25000,
        pan: 'ABCDE1234F',
        declarations: {
          notPoliticalEntity: true,
          notForeign: true,
        },
      });
      assert.equal(valid.success, true);

      const invalid = CreateDonationSchema.safeParse({
        donorEmail: 'citizen@example.com',
        amountPaise: 25000,
        pan: 'INVALIDPAN',
        declarations: {
          notPoliticalEntity: true,
          notForeign: true,
        },
      });
      assert.equal(invalid.success, false);
    });
  });

  describe('2. PAN Encryption at Rest & Masking', () => {
    it('encrypts PAN with AES-256-GCM and decrypts accurately', () => {
      const pan = 'ABCDE1234F';
      const encrypted = encryptPan(pan);

      assert.notEqual(encrypted, pan);
      assert.ok(encrypted.includes(':'), 'Encrypted string must contain IV, tag and ciphertext');

      const decrypted = decryptPan(encrypted);
      assert.equal(decrypted, pan);
    });

    it('masks PAN to only show the last 4 alphanumeric characters', () => {
      const pan = 'ABCDE1234F';
      const masked = maskPan(pan);
      assert.equal(masked, '••••••234F');
    });
  });

  describe('3. Webhook Payment Capture & Receipt Issuance', () => {
    it('completes donation and assigns sequential DON receipt on capture', async () => {
      const mockDonationId = new mongoose.Types.ObjectId();
      const mockDonation: any = {
        _id: mockDonationId,
        donorUserId: new mongoose.Types.ObjectId(),
        donorEmail: 'citizen@example.com',
        donorName: 'Aarav Sharma',
        amountPaise: 50000,
        status: 'created',
        type: 'one_time',
        providerOrderId: 'order_don_123',
        save: async function () {
          return this;
        },
      };

      const originalDonationFindOne = Donation.findOne;
      const originalFinSeqFindOneAndUpdate = FinancialSequence.findOneAndUpdate;
      const originalAuditCreate = AuditLog.create;

      try {
        Donation.findOne = (() => Promise.resolve(mockDonation)) as any;
        FinancialSequence.findOneAndUpdate = (() =>
          Promise.resolve({
            prefix: 'DON',
            financialYear: '2026-27',
            lastSequence: 42,
          })) as any;
        AuditLog.create = (() => Promise.resolve({})) as any;

        const completed = await DonationService.completeDonation('order_don_123', 'pay_mock_789');

        assert.ok(completed);
        assert.equal(completed.status, 'paid');
        assert.equal(completed.providerPaymentId, 'pay_mock_789');
        assert.equal(completed.receiptNumber, 'RAISE/DON/2026-27/000042');
        assert.ok(completed.paidAt);
      } finally {
        Donation.findOne = originalDonationFindOne;
        FinancialSequence.findOneAndUpdate = originalFinSeqFindOneAndUpdate;
        AuditLog.create = originalAuditCreate;
      }
    });

    it('safely skips already paid donations idempotently', async () => {
      const mockPaidDonation: any = {
        status: 'paid',
        receiptNumber: 'RAISE/DON/2026-27/000010',
        save: async () => {},
      };

      const originalDonationFindOne = Donation.findOne;
      try {
        Donation.findOne = (() => Promise.resolve(mockPaidDonation)) as any;
        const res = await DonationService.completeDonation('order_already_paid', 'pay_mock_111');
        assert.equal(res?.receiptNumber, 'RAISE/DON/2026-27/000010');
      } finally {
        Donation.findOne = originalDonationFindOne;
      }
    });
  });

  describe('4. Monthly Recurring Supporter Cancellation', () => {
    it('cancels recurring subscription using secret cancellation token', async () => {
      const mockSub: any = {
        _id: new mongoose.Types.ObjectId(),
        cancelToken: 'secret_token_abc',
        status: 'active',
        providerSubscriptionId: 'sub_mock_123',
        donorEmail: 'monthly@example.com',
        save: async function () {
          return this;
        },
      };

      const originalSubFindOne = DonorSubscription.findOne;
      const originalAuditCreate = AuditLog.create;

      try {
        DonorSubscription.findOne = (() => Promise.resolve(mockSub)) as any;
        AuditLog.create = (() => Promise.resolve({})) as any;

        const canceled = await DonationService.cancelMonthlySupporter('secret_token_abc');
        assert.equal(canceled, true);
        assert.equal(mockSub.status, 'canceled');
        assert.ok(mockSub.canceledAt);
      } finally {
        DonorSubscription.findOne = originalSubFindOne;
        AuditLog.create = originalAuditCreate;
      }
    });

    it('returns false for nonexistent or already canceled token', async () => {
      const originalSubFindOne = DonorSubscription.findOne;
      try {
        DonorSubscription.findOne = (() => Promise.resolve(null)) as any;
        const canceled = await DonationService.cancelMonthlySupporter('unknown_token');
        assert.equal(canceled, false);
      } finally {
        DonorSubscription.findOne = originalSubFindOne;
      }
    });
  });

  describe('5. Admin Refund & Statutory Audit Logging', () => {
    it('processes refund on paid donation and records reason to AuditLog', async () => {
      const mockDonationId = new mongoose.Types.ObjectId();
      const mockPaidDonation: any = {
        _id: mockDonationId,
        status: 'paid',
        amountPaise: 100000,
        providerPaymentId: 'pay_mock_999',
        receiptNumber: 'RAISE/DON/2026-27/000088',
        save: async function () {
          return this;
        },
      };

      const originalDonationFindById = Donation.findById;
      const originalAuditCreate = AuditLog.create;
      let auditLoggedAction = '';

      try {
        Donation.findById = (() => Promise.resolve(mockPaidDonation)) as any;
        AuditLog.create = ((log: any) => {
          auditLoggedAction = log.action;
          return Promise.resolve(log);
        }) as any;

        const refunded = await DonationService.refundDonation(
          mockDonationId.toString(),
          new mongoose.Types.ObjectId().toString(),
          'Duplicate donation error by donor bank'
        );

        assert.equal(refunded.status, 'refunded');
        assert.equal(refunded.refundReason, 'Duplicate donation error by donor bank');
        assert.equal(auditLoggedAction, 'DONATION_REFUND_PROCESSED');
      } finally {
        Donation.findById = originalDonationFindById;
        AuditLog.create = originalAuditCreate;
      }
    });
  });

  describe('6. Print-Ready HTML Receipt & Neutrality Notice', () => {
    it('embeds statutory neutrality guarantee and tax notice in receipt HTML', () => {
      const donation: any = {
        receiptNumber: 'RAISE/DON/2026-27/000015',
        donorName: 'Sunita Rao',
        donorEmail: 'sunita@example.com',
        amountPaise: 250000,
        type: 'one_time',
        paidAt: new Date('2026-05-15T10:00:00Z'),
        receipt80G: false,
      };

      const html = DonationService.renderReceiptHtml(donation);
      assert.ok(html.includes('DONATION RECEIPT'));
      assert.ok(html.includes('RAISE/DON/2026-27/000015'));
      assert.ok(html.includes('Non-Negotiable Civic Guarantee'));
      assert.ok(html.includes('zero special privileges, trust score boosts'));
    });
  });
});
