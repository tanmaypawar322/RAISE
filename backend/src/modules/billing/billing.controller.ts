import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import { Plan } from '../../models/Plan.js';
import { Subscription } from '../../models/Subscription.js';
import { Invoice } from '../../models/Invoice.js';
import { Office } from '../../models/Office.js';
import { Issue } from '../../models/Issue.js';
import { EntitlementsService } from '../../services/entitlements.service.js';
import { SubscriptionService } from '../../services/subscription.service.js';
import { InvoiceService } from '../../services/invoice.service.js';
import { PaymentService } from '../../services/payment/payment.service.js';
import { AuditLog } from '../../models/AuditLog.js';

export class BillingController {
  /**
   * Helper verifying caller has admin rights over the target office (IDOR protection)
   */
  static isOfficeAdmin(req: Request, officeId: string): boolean {
    if (!req.user) return false;
    if (req.user.role === 'admin') return true;

    // Check office memberships
    const userMemberships = req.user.officeMemberships || [];
    return userMemberships.some(
      (m) =>
        m.officeId === officeId &&
        m.status === 'active' &&
        ['office_admin', 'head'].includes(m.memberRole)
    );
  }

  /**
   * GET /api/plans (public, cacheable)
   */
  static async getPlans(req: Request, res: Response): Promise<void> {
    if (!config.billingEnabled) {
      res.status(404).json({ success: false, message: 'Billing services are not enabled.' });
      return;
    }

    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.json({ success: true, plans });
  }

  /**
   * GET /api/billing/office/:officeId
   */
  static async getOfficeBilling(req: Request, res: Response): Promise<void> {
    if (!config.billingEnabled) {
      res.status(404).json({ success: false, message: 'Billing services are not enabled.' });
      return;
    }

    const { officeId } = req.params;
    if (!BillingController.isOfficeAdmin(req, officeId)) {
      res.status(403).json({ success: false, message: 'Access denied: IDOR protection. You are not an administrator of this office.' });
      return;
    }

    const { plan, planKey, subscription } = await EntitlementsService.resolveOfficePlan(officeId);
    const seatInfo = await SubscriptionService.checkSeatLimit(officeId);
    const invoices = await Invoice.find({ officeId: new mongoose.Types.ObjectId(officeId) })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json({
      success: true,
      currentPlan: plan,
      planKey,
      subscription,
      seats: seatInfo,
      invoices,
    });
  }

  /**
   * POST /api/billing/office/:officeId/checkout
   */
  static async createCheckout(req: Request, res: Response): Promise<void> {
    if (!config.billingEnabled) {
      res.status(404).json({ success: false, message: 'Billing services are not enabled.' });
      return;
    }

    const { officeId } = req.params;
    if (!BillingController.isOfficeAdmin(req, officeId)) {
      res.status(403).json({ success: false, message: 'Access denied: IDOR protection.' });
      return;
    }

    const { planKey, interval } = req.body;
    if (!planKey) {
      res.status(400).json({ success: false, message: 'Plan key is required.' });
      return;
    }

    try {
      const checkoutResult = await SubscriptionService.createSelfServeCheckout(
        officeId,
        planKey,
        interval || 'monthly',
        req.user?.userId
      );

      res.json({
        success: true,
        providerSubscriptionId: checkoutResult.providerSubscriptionId,
        checkoutUrl: checkoutResult.checkoutUrl,
        keyId: config.razorpayKeyId,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/billing/office/:officeId/cancel
   */
  static async cancelSubscription(req: Request, res: Response): Promise<void> {
    if (!config.billingEnabled) {
      res.status(404).json({ success: false, message: 'Billing services are not enabled.' });
      return;
    }

    const { officeId } = req.params;
    if (!BillingController.isOfficeAdmin(req, officeId)) {
      res.status(403).json({ success: false, message: 'Access denied: IDOR protection.' });
      return;
    }

    const sub = await Subscription.findOne({
      officeId: new mongoose.Types.ObjectId(officeId),
      status: 'active',
    }).sort({ createdAt: -1 });

    if (!sub) {
      res.status(404).json({ success: false, message: 'No active subscription found to cancel.' });
      return;
    }

    sub.cancelAtPeriodEnd = true;
    await sub.save();

    if (sub.providerSubscriptionId && sub.provider !== 'manual_invoice') {
      const provider = PaymentService.getProvider();
      await provider.cancelSubscription(sub.providerSubscriptionId, true);
    }

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(req.user?.userId),
      actorRole: req.user?.role,
      action: 'BILLING_SUBSCRIPTION_CANCEL_SCHEDULED',
      targetType: 'Subscription',
      targetId: sub._id.toString(),
      details: { officeId, currentPeriodEnd: sub.currentPeriodEnd },
    });

    res.json({
      success: true,
      message: 'Subscription will remain active until the end of the current billing period.',
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  }

  /**
   * GET /api/billing/office/:officeId/invoices
   */
  static async getOfficeInvoices(req: Request, res: Response): Promise<void> {
    if (!config.billingEnabled) {
      res.status(404).json({ success: false, message: 'Billing services are not enabled.' });
      return;
    }

    const { officeId } = req.params;
    if (!BillingController.isOfficeAdmin(req, officeId)) {
      res.status(403).json({ success: false, message: 'Access denied: IDOR protection.' });
      return;
    }

    const invoices = await Invoice.find({ officeId: new mongoose.Types.ObjectId(officeId) }).sort({
      createdAt: -1,
    });
    res.json({ success: true, invoices });
  }

  /**
   * GET /api/billing/office/:officeId/invoices/:id/pdf
   */
  static async getInvoicePdf(req: Request, res: Response): Promise<void> {
    if (!config.billingEnabled) {
      res.status(404).json({ success: false, message: 'Billing services are not enabled.' });
      return;
    }

    const { officeId, id } = req.params;
    if (!BillingController.isOfficeAdmin(req, officeId)) {
      res.status(403).json({ success: false, message: 'Access denied: IDOR protection.' });
      return;
    }

    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      officeId: new mongoose.Types.ObjectId(officeId),
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const html = InvoiceService.renderInvoiceHtml(invoice);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * POST /api/billing/office/:officeId/export
   * NON-NEGOTIABLE RULE 4: Data export is ALWAYS allowed, even on Basic or lapsed subscriptions.
   * Never held hostage.
   */
  static async exportOfficeData(req: Request, res: Response): Promise<void> {
    const { officeId } = req.params;
    if (!BillingController.isOfficeAdmin(req, officeId)) {
      res.status(403).json({ success: false, message: 'Access denied: IDOR protection.' });
      return;
    }

    // Always permitted regardless of subscription plan
    const office = await Office.findById(officeId);
    if (!office) {
      res.status(404).json({ success: false, message: 'Office not found.' });
      return;
    }

    const issues = await Issue.find({ officeId: office._id })
      .select('title category status createdAt updatedAt location description statusTimeline')
      .lean();

    const headers = 'ID,Title,Category,Status,CreatedAt,UpdatedAt,Address\n';
    const rows = issues
      .map(
        (i: any) =>
          `"${i._id}","${(i.title || '').replace(/"/g, '""')}","${i.category}","${i.status}","${i.createdAt}","${i.updatedAt}","${(i.location?.address || '').replace(/"/g, '""')}"`
      )
      .join('\n');

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(req.user?.userId),
      actorRole: req.user?.role,
      action: 'OFFICE_DATA_EXPORTED',
      targetType: 'Office',
      targetId: officeId,
      details: { issuesCount: issues.length, freeTierExport: true },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="raise-office-export-${officeId}-${Date.now()}.csv"`
    );
    res.send(headers + rows);
  }
}
