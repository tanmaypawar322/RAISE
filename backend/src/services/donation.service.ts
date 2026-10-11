import crypto from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../config/env.js';
import { Donation, IDonation } from '../models/Donation.js';
import { DonorSubscription } from '../models/DonorSubscription.js';
import { PaymentService } from './payment/payment.service.js';
import { FinancialSequenceService } from './financial-sequence.service.js';
import { encryptPan, maskPan } from '../utils/pan-crypto.js';
import { formatInr } from '../utils/money.js';
import { AuditLog } from '../models/AuditLog.js';
import { EmailService } from './email/email.service.js';

export const CreateDonationSchema = z.object({
  donorName: z.string().trim().max(100).optional(),
  donorEmail: z.string().trim().email(),
  amountPaise: z
    .number()
    .int()
    .min(config.donationMinPaise, `Minimum donation is ${formatInr(config.donationMinPaise)}`)
    .max(config.donationMaxPaise, `Maximum online donation is ${formatInr(config.donationMaxPaise)}`),
  type: z.enum(['one_time', 'recurring']).default('one_time'),
  anonymous: z.boolean().default(false),
  showOnSupportersList: z.boolean().default(false),
  pan: z
    .string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid Indian PAN format')
    .optional(),
  declarations: z.object({
    notPoliticalEntity: z.literal(true, {
      errorMap: () => ({ message: 'You must declare that you are not donating on behalf of a political entity.' }),
    }),
    notForeign: z.literal(true, {
      errorMap: () => ({ message: 'Under current FCRA compliance, foreign funds cannot be accepted.' }),
    }),
  }),
});

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;

export class DonationService {
  /**
   * Creates a pending donation and initiates payment order / subscription
   */
  static async createDonationOrder(
    input: CreateDonationInput,
    userId?: string
  ): Promise<{
    donationId: string;
    providerOrderId?: string;
    providerSubscriptionId?: string;
    amountPaise: number;
    type: 'one_time' | 'recurring';
    keyId: string;
  }> {
    const validated = CreateDonationSchema.parse(input);
    const provider = PaymentService.getProvider();

    let panEnc: string | undefined;
    let panMasked: string | undefined;
    let receipt80G = false;

    if (validated.pan && config.org80gEnabled) {
      panEnc = encryptPan(validated.pan);
      panMasked = maskPan(validated.pan);
      receipt80G = true;
    }

    if (validated.type === 'one_time') {
      const order = await provider.createOrder({
        amountPaise: validated.amountPaise,
        receipt: `DON_PENDING_${Date.now()}`,
        notes: {
          donorEmail: validated.donorEmail,
          purpose: 'General Civic Platform Donation',
        },
      });

      const donation = await Donation.create({
        donorUserId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        donorName: validated.donorName,
        donorEmail: validated.donorEmail,
        amountPaise: validated.amountPaise,
        type: 'one_time',
        status: 'created',
        fund: 'general',
        anonymous: validated.anonymous,
        showOnSupportersList: validated.showOnSupportersList,
        provider: provider.providerName,
        providerOrderId: order.providerOrderId,
        receipt80G,
        panEnc,
        panMasked,
        declarations: validated.declarations,
      });

      return {
        donationId: donation._id.toString(),
        providerOrderId: order.providerOrderId,
        amountPaise: validated.amountPaise,
        type: 'one_time',
        keyId: config.razorpayKeyId,
      };
    } else {
      // Monthly recurring supporter
      const sub = await provider.createSubscription({
        planKey: 'supporter_monthly',
        customerNotify: true,
        notes: {
          donorEmail: validated.donorEmail,
          purpose: 'Monthly Civic Platform Supporter',
        },
      });

      const cancelToken = crypto.randomBytes(32).toString('hex');

      await DonorSubscription.create({
        donorUserId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        donorEmail: validated.donorEmail,
        donorName: validated.donorName,
        amountPaise: validated.amountPaise,
        status: 'active',
        provider: provider.providerName,
        providerSubscriptionId: sub.providerSubscriptionId,
        cancelToken,
        receipt80G,
        panEnc,
        panMasked,
        showOnSupportersList: validated.showOnSupportersList,
        declarations: validated.declarations,
      });

      const donation = await Donation.create({
        donorUserId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        donorName: validated.donorName,
        donorEmail: validated.donorEmail,
        amountPaise: validated.amountPaise,
        type: 'recurring',
        status: 'created',
        fund: 'general',
        anonymous: validated.anonymous,
        showOnSupportersList: validated.showOnSupportersList,
        provider: provider.providerName,
        providerSubscriptionId: sub.providerSubscriptionId,
        receipt80G,
        panEnc,
        panMasked,
        declarations: validated.declarations,
      });

      return {
        donationId: donation._id.toString(),
        providerSubscriptionId: sub.providerSubscriptionId,
        amountPaise: validated.amountPaise,
        type: 'recurring',
        keyId: config.razorpayKeyId,
      };
    }
  }

  /**
   * Completes donation upon verified webhook payment capture
   */
  static async completeDonation(
    providerOrderIdOrSubId: string,
    providerPaymentId: string
  ): Promise<IDonation | null> {
    let donation = await Donation.findOne({
      $or: [
        { providerOrderId: providerOrderIdOrSubId },
        { providerSubscriptionId: providerOrderIdOrSubId },
      ],
    });

    if (!donation) return null;
    if (donation.status === 'paid') return donation; // Idempotent skip

    const receiptNumber = await FinancialSequenceService.getNextSequence('DON');

    donation.status = 'paid';
    donation.paidAt = new Date();
    donation.providerPaymentId = providerPaymentId;
    donation.receiptNumber = receiptNumber;
    await donation.save();

    await AuditLog.create({
      actorId: donation.donorUserId,
      actorRole: 'citizen',
      action: 'DONATION_PAYMENT_CAPTURED',
      targetType: 'Donation',
      targetId: donation._id.toString(),
      details: {
        receiptNumber,
        amountPaise: donation.amountPaise,
        type: donation.type,
      },
    });

    // Send receipt email
    try {
      const receiptHtml = this.renderReceiptHtml(donation);
      await EmailService.sendEmail({
        to: donation.donorEmail,
        subject: `Donation Receipt (${receiptNumber}) - Thank you for supporting RAISE`,
        html: receiptHtml,
      });
    } catch {
      // Email failure should not abort donation capture
    }

    return donation;
  }

  /**
   * Cancels a monthly recurring supporter subscription
   */
  static async cancelMonthlySupporter(cancelToken: string): Promise<boolean> {
    const sub = await DonorSubscription.findOne({ cancelToken });
    if (!sub || sub.status === 'canceled') return false;

    sub.status = 'canceled';
    sub.canceledAt = new Date();
    await sub.save();

    const provider = PaymentService.getProvider();
    await provider.cancelSubscription(sub.providerSubscriptionId, true);

    await AuditLog.create({
      actorId: sub.donorUserId,
      actorRole: 'citizen',
      action: 'MONTHLY_DONATION_CANCELED',
      targetType: 'DonorSubscription',
      targetId: sub._id.toString(),
      details: { email: sub.donorEmail },
    });

    return true;
  }

  /**
   * Admin-only refund for duplicates or mistakes
   */
  static async refundDonation(
    donationId: string,
    adminUserId: string,
    reason: string
  ): Promise<IDonation> {
    const donation = await Donation.findById(donationId);
    if (!donation) throw new Error('Donation not found.');
    if (donation.status !== 'paid') throw new Error('Only paid donations can be refunded.');

    const provider = PaymentService.getProvider();
    if (donation.providerPaymentId) {
      await provider.refund(donation.providerPaymentId, donation.amountPaise, { reason });
    }

    donation.status = 'refunded';
    donation.refundReason = reason;
    donation.refundedAt = new Date();
    await donation.save();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUserId),
      actorRole: 'admin',
      action: 'DONATION_REFUND_PROCESSED',
      targetType: 'Donation',
      targetId: donation._id.toString(),
      details: { receiptNumber: donation.receiptNumber, reason },
    });

    return donation;
  }

  /**
   * Renders print-ready donation receipt HTML.
   * NOTE: Statutory wording must be confirmed with the CA/lawyer before live deployment.
   */
  static renderReceiptHtml(donation: IDonation): string {
    const is80G = donation.receipt80G && config.org80gEnabled;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Donation Receipt - ${donation.receiptNumber || 'Receipt'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; max-width: 750px; margin: auto; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
    .badge { display: inline-block; padding: 4px 12px; font-weight: 700; border-radius: 9999px; font-size: 11px; background: #dcfce7; color: #166534; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 13px; }
    .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .amount { font-size: 32px; font-weight: 900; color: #047857; margin: 4px 0; }
    .disclaimer { font-size: 11px; color: #64748b; line-height: 1.5; background: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 8px; margin-top: 24px; }
    .footer { font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">DONATION RECEIPT</h1>
      <p style="margin: 4px 0 0 0; color: #64748b; font-weight: 600;">${donation.receiptNumber || 'RAISE/DON/PENDING'}</p>
    </div>
    <div style="text-align: right;">
      <span class="badge">OFFICIALLY ACKNOWLEDGED</span>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">
        Date: ${new Date(donation.paidAt || donation.createdAt).toLocaleDateString('en-IN')}
      </p>
    </div>
  </div>

  <div class="grid">
    <div>
      <strong style="color: #0f172a;">Organization Details:</strong><br>
      ${config.orgLegalName}<br>
      ${config.orgAddress}<br>
      ${config.orgPan ? `PAN: ${config.orgPan}<br>` : ''}
      ${config.org12aRegNo ? `12A Reg No: ${config.org12aRegNo}<br>` : ''}
      ${is80G && config.org80gRegNo ? `<strong>80G Reg No:</strong> ${config.org80gRegNo}<br>` : ''}
      Email: ${config.supportEmail}
    </div>
    <div>
      <strong style="color: #0f172a;">Donor Details:</strong><br>
      Name: ${donation.donorName || 'Civic Supporter'}<br>
      Email: ${donation.donorEmail}<br>
      ${donation.panMasked ? `PAN: ${donation.panMasked}<br>` : ''}
      Contribution Mode: ${donation.type === 'recurring' ? 'Monthly Recurring Supporter' : 'One-Time Contribution'}
    </div>
  </div>

  <div class="amount-box">
    <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Amount Received</span>
    <div class="amount">${formatInr(donation.amountPaise)}</div>
    <span style="font-size: 12px; color: #64748b;">Indian Rupees (INR)</span>
  </div>

  <div class="disclaimer">
    ${
      is80G
        ? `<strong>Section 80G Notice:</strong> Donations to ${config.orgLegalName} are eligible for tax deduction under Section 80G of the Income Tax Act, 1961 (Registration No. ${config.org80gRegNo}).`
        : `<strong>Tax Notice:</strong> This receipt is for general non-profit platform support and is <strong>not eligible for tax deduction under Section 80G</strong>.`
    }
    <br><br>
    <strong>Non-Negotiable Civic Guarantee:</strong> Donations provide zero special privileges, trust score boosts, ranking advantages, or moderation exemptions on the RAISE platform.
  </div>

  <div class="footer">
    This is an automated receipt issued by RAISE Civic Trust Foundation. For inquiries, contact ${config.supportEmail}.
  </div>
</body>
</html>`;
  }
}
