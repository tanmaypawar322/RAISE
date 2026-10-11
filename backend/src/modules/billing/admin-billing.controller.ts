import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Plan } from '../../models/Plan.js';
import { Subscription } from '../../models/Subscription.js';
import { Invoice } from '../../models/Invoice.js';
import { SubscriptionService } from '../../services/subscription.service.js';
import { InvoiceService } from '../../services/invoice.service.js';
import { AuditLog } from '../../models/AuditLog.js';

export class AdminBillingController {
  /**
   * GET /api/admin/billing/overview
   * Computes MRR, active subscription breakdown, and past_due list
   */
  static async getOverview(req: Request, res: Response): Promise<void> {
    const subscriptions = await Subscription.find().populate('officeId', 'name kind').lean();
    const plans = await Plan.find().lean();
    const planMap = new Map(plans.map((p) => [p.key, p]));

    let activeSubs = 0;
    let mrrPaise = 0;
    const pastDueList: any[] = [];

    for (const sub of subscriptions) {
      if (sub.status === 'active') {
        activeSubs++;
        const plan = planMap.get(sub.planKey);
        if (plan) {
          if (sub.interval === 'yearly') {
            mrrPaise += Math.round(plan.priceYearlyPaise / 12);
          } else {
            mrrPaise += plan.priceMonthlyPaise;
          }
        }
      } else if (sub.status === 'past_due') {
        pastDueList.push(sub);
      }
    }

    res.json({
      success: true,
      activeSubs,
      mrrPaise,
      pastDueCount: pastDueList.length,
      pastDueList,
      subscriptions,
    });
  }

  /**
   * POST /api/admin/billing/subscriptions
   * Creates an invoice-mode subscription (standard for government offices)
   */
  static async createInvoiceModeSubscription(req: Request, res: Response): Promise<void> {
    try {
      const {
        officeId,
        planKey,
        interval,
        seats,
        buyerName,
        buyerGstin,
        buyerAddress,
        buyerEmail,
        placeOfSupply,
      } = req.body;

      if (!officeId || !planKey || !buyerName || !placeOfSupply) {
        res.status(400).json({
          success: false,
          message: 'officeId, planKey, buyerName, and placeOfSupply are required.',
        });
        return;
      }

      const result = await SubscriptionService.createInvoiceModeSubscription(
        req.user?.userId || '000000000000000000000000',
        {
          officeId,
          planKey,
          interval,
          seats,
          buyerName,
          buyerGstin,
          buyerAddress,
          buyerEmail,
          placeOfSupply,
        }
      );

      res.status(201).json({
        success: true,
        subscription: result.subscription,
        invoice: result.invoice,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/billing/invoices
   */
  static async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoice = await InvoiceService.createInvoice(req.body);

      await AuditLog.create({
        actorId: new mongoose.Types.ObjectId(req.user?.userId),
        actorRole: 'admin',
        action: 'ADMIN_MANUAL_INVOICE_CREATED',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
        details: { invoiceNumber: invoice.number, totalPaise: invoice.totalPaise },
      });

      res.status(201).json({ success: true, invoice });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/billing/invoices/:id/mark-paid
   */
  static async markInvoicePaid(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { paymentRef } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentRef = paymentRef || `MANUAL_REF_${Date.now()}`;
    await invoice.save();

    // If tied to subscription, ensure subscription is active
    if (invoice.subscriptionId) {
      await Subscription.findByIdAndUpdate(invoice.subscriptionId, {
        status: 'active',
        graceUntil: undefined,
        lastPaymentError: undefined,
      });
    }

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(req.user?.userId),
      actorRole: 'admin',
      action: 'ADMIN_INVOICE_MARKED_PAID',
      targetType: 'Invoice',
      targetId: invoice._id.toString(),
      details: { invoiceNumber: invoice.number, paymentRef: invoice.paymentRef },
    });

    res.json({ success: true, invoice });
  }

  /**
   * PATCH /api/admin/billing/plans/:key
   */
  static async updatePlan(req: Request, res: Response): Promise<void> {
    const { key } = req.params;
    const plan = await Plan.findOneAndUpdate({ key }, { $set: req.body }, { new: true });

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(req.user?.userId),
      actorRole: 'admin',
      action: 'ADMIN_PLAN_UPDATED',
      targetType: 'Plan',
      targetId: plan._id.toString(),
      details: { planKey: key, updates: req.body },
    });

    res.json({ success: true, plan });
  }
}
