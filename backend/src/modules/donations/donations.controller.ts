import { Request, Response } from 'express';
import { config } from '../../config/env.js';
import { Donation } from '../../models/Donation.js';
import { DonationService } from '../../services/donation.service.js';

export class DonationsController {
  /**
   * POST /api/donations
   */
  static async createDonation(req: Request, res: Response): Promise<void> {
    if (!config.donationsEnabled) {
      res.status(404).json({ success: false, message: 'Donations are not enabled.' });
      return;
    }

    try {
      const result = await DonationService.createDonationOrder(req.body, req.user?.userId);
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Invalid donation parameters.' });
    }
  }

  /**
   * GET /api/donations/receipt/:receiptNumber
   */
  static async getReceipt(req: Request, res: Response): Promise<void> {
    if (!config.donationsEnabled) {
      res.status(404).json({ success: false, message: 'Donations are not enabled.' });
      return;
    }

    const { receiptNumber } = req.params;
    const donation = await Donation.findOne({ receiptNumber });
    if (!donation) {
      res.status(404).json({ success: false, message: 'Receipt not found.' });
      return;
    }

    if (req.query.format === 'html') {
      const html = DonationService.renderReceiptHtml(donation);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }

    res.json({
      success: true,
      receipt: {
        receiptNumber: donation.receiptNumber,
        amountPaise: donation.amountPaise,
        date: donation.paidAt || donation.createdAt,
        type: donation.type,
        receipt80G: donation.receipt80G,
        panMasked: donation.panMasked,
        donorName: donation.anonymous ? 'Anonymous' : donation.donorName,
      },
    });
  }

  /**
   * GET /api/donations/supporters
   * Public opt-in supporters list showing first name or chosen name.
   * Zero amounts or personal contact info exposed.
   */
  static async getSupportersList(req: Request, res: Response): Promise<void> {
    if (!config.donationsEnabled) {
      res.status(404).json({ success: false, message: 'Donations are not enabled.' });
      return;
    }

    const supporters = await Donation.find({
      status: 'paid',
      showOnSupportersList: true,
      anonymous: false,
    })
      .select('donorName createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = supporters.map((s) => {
      const rawName = s.donorName?.trim() || 'Supporter';
      // First name or chosen pseudonym only
      const displayName = rawName.split(' ')[0];
      return {
        name: displayName,
        date: s.createdAt,
      };
    });

    res.json({ success: true, supporters: formatted });
  }

  /**
   * POST /api/donations/cancel-monthly
   */
  static async cancelMonthly(req: Request, res: Response): Promise<void> {
    if (!config.donationsEnabled) {
      res.status(404).json({ success: false, message: 'Donations are not enabled.' });
      return;
    }

    const { cancelToken } = req.body;
    if (!cancelToken) {
      res.status(400).json({ success: false, message: 'Cancel token is required.' });
      return;
    }

    const success = await DonationService.cancelMonthlySupporter(cancelToken);
    if (!success) {
      res.status(404).json({ success: false, message: 'Supporter subscription not found or already canceled.' });
      return;
    }

    res.json({ success: true, message: 'Your monthly support subscription has been successfully canceled.' });
  }

  /**
   * POST /api/admin/donations/:id/refund
   */
  static async refundDonation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.length < 5) {
      res.status(400).json({ success: false, message: 'A detailed refund justification is required.' });
      return;
    }

    try {
      const donation = await DonationService.refundDonation(
        id,
        req.user?.userId || '000000000000000000000000',
        reason
      );
      res.json({ success: true, donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
