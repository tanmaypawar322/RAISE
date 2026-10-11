import mongoose from 'mongoose';
import { z } from 'zod';
import { FinanceEntry, IFinanceEntry, FinanceCategory, FinanceType } from '../../models/FinanceEntry.js';
import { Donation } from '../../models/Donation.js';
import { Invoice } from '../../models/Invoice.js';
import { getFinancialYear, formatInr, paiseToRupees } from '../../utils/money.js';
import { AuditLog } from '../../models/AuditLog.js';

export const CreateFinanceEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.enum([
    'donations',
    'subscriptions',
    'grants',
    'hosting',
    'sms',
    'legal',
    'payroll',
    'audit',
    'other',
  ]),
  amountPaise: z.number().int().min(1, 'Amount must be at least 1 paise'),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  description: z.string().trim().min(3).max(300),
  sourceName: z.string().trim().max(120).optional(),
  isPublic: z.boolean().default(true),
  attachmentUrl: z.string().trim().url().optional(),
});

export type CreateFinanceEntryInput = z.input<typeof CreateFinanceEntrySchema>;

export interface PublicLedgerSummary {
  totals: {
    totalIncomePaise: number;
    totalExpensePaise: number;
    netBalancePaise: number;
    donorCount: number;
    averageDonationPaise: number;
  };
  concentration: {
    trailing12mIncomePaise: number;
    concentrationExceeded: boolean; // Flagged if any funder > 25%
    maxFunderName?: string;
    maxFunderPercent: number;
  };
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  monthlyBreakdown: Array<{
    month: string; // YYYY-MM
    incomePaise: number;
    expensePaise: number;
  }>;
  financialYearBreakdown: Array<{
    fy: string; // e.g. "2026-27"
    incomePaise: number;
    expensePaise: number;
  }>;
  recentEntries: Array<{
    date: Date;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amountPaise: number;
    sourceName?: string;
  }>;
}

export class FinanceService {
  /**
   * Builds the comprehensive public transparency ledger.
   * Pulls automated revenues (donations + invoices) and manual entries.
   */
  static async getPublicLedger(): Promise<PublicLedgerSummary> {
    const manualEntries = await FinanceEntry.find({ isPublic: true }).sort({ date: -1 }).lean();
    const paidDonations = await Donation.find({ status: 'paid' }).sort({ paidAt: -1 }).lean();
    const paidInvoices = await Invoice.find({ status: 'paid' }).sort({ paidAt: -1 }).lean();

    let totalIncomePaise = 0;
    let totalExpensePaise = 0;

    const incomeByCategory: Record<string, number> = {
      donations: 0,
      subscriptions: 0,
      grants: 0,
      other: 0,
    };

    const expenseByCategory: Record<string, number> = {
      hosting: 0,
      sms: 0,
      legal: 0,
      payroll: 0,
      audit: 0,
      other: 0,
    };

    const monthlyMap: Record<string, { incomePaise: number; expensePaise: number }> = {};
    const fyMap: Record<string, { incomePaise: number; expensePaise: number }> = {};
    const funderMap: Record<string, number> = {};

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    let trailing12mIncomePaise = 0;

    const allEntriesForTimeline: Array<{
      date: Date;
      type: 'income' | 'expense';
      category: string;
      description: string;
      amountPaise: number;
      sourceName?: string;
    }> = [];

    const recordIncome = (
      date: Date,
      category: string,
      amountPaise: number,
      funderKey: string,
      description: string,
      publicSourceName?: string
    ) => {
      totalIncomePaise += amountPaise;
      incomeByCategory[category] = (incomeByCategory[category] || 0) + amountPaise;

      const ym = date.toISOString().slice(0, 7);
      if (!monthlyMap[ym]) monthlyMap[ym] = { incomePaise: 0, expensePaise: 0 };
      monthlyMap[ym].incomePaise += amountPaise;

      const fy = getFinancialYear(date);
      if (!fyMap[fy]) fyMap[fy] = { incomePaise: 0, expensePaise: 0 };
      fyMap[fy].incomePaise += amountPaise;

      if (date >= twelveMonthsAgo) {
        trailing12mIncomePaise += amountPaise;
        if (funderKey) {
          funderMap[funderKey] = (funderMap[funderKey] || 0) + amountPaise;
        }
      }

      allEntriesForTimeline.push({
        date,
        type: 'income',
        category,
        description,
        amountPaise,
        sourceName: publicSourceName,
      });
    };

    const recordExpense = (date: Date, category: string, amountPaise: number, description: string, vendorName?: string) => {
      totalExpensePaise += amountPaise;
      expenseByCategory[category] = (expenseByCategory[category] || 0) + amountPaise;

      const ym = date.toISOString().slice(0, 7);
      if (!monthlyMap[ym]) monthlyMap[ym] = { incomePaise: 0, expensePaise: 0 };
      monthlyMap[ym].expensePaise += amountPaise;

      const fy = getFinancialYear(date);
      if (!fyMap[fy]) fyMap[fy] = { incomePaise: 0, expensePaise: 0 };
      fyMap[fy].expensePaise += amountPaise;

      allEntriesForTimeline.push({
        date,
        type: 'expense',
        category,
        description,
        amountPaise,
        sourceName: vendorName,
      });
    };

    // 1. Ingest paid donations (individual donor identities kept anonymous in public aggregation)
    for (const don of paidDonations) {
      const dDate = don.paidAt || don.createdAt;
      const donorKey = (don.donorUserId || don._id || Math.random()).toString();
      recordIncome(
        dDate,
        'donations',
        don.amountPaise,
        `donor_${donorKey}`,
        don.type === 'recurring' ? 'Monthly Recurring Supporter' : 'Voluntary Citizen Contribution',
        undefined
      );
    }

    // 2. Ingest paid subscription invoices
    for (const inv of paidInvoices) {
      const iDate = inv.paidAt || inv.createdAt;
      const desc = inv.lineItems?.[0]?.description || 'Organization Plan';
      const bName = inv.buyerName || 'Organization Subscription';
      recordIncome(
        iDate,
        'subscriptions',
        inv.totalPaise,
        bName,
        desc,
        bName
      );
    }

    // 3. Ingest manual ledger entries
    for (const entry of manualEntries) {
      if (entry.type === 'income') {
        const sName = entry.sourceName || 'General Income';
        recordIncome(
          entry.date,
          entry.category,
          entry.amountPaise,
          sName,
          entry.description,
          sName
        );
      } else {
        recordExpense(
          entry.date,
          entry.category,
          entry.amountPaise,
          entry.description,
          entry.sourceName
        );
      }
    }

    // Calculate Concentration Ratio
    let maxFunderKey = '';
    let maxFunderPaise = 0;
    for (const [funder, amount] of Object.entries(funderMap)) {
      if (amount > maxFunderPaise) {
        maxFunderPaise = amount;
        maxFunderKey = funder;
      }
    }

    const maxFunderPercent =
      trailing12mIncomePaise > 0 ? Math.round((maxFunderPaise / trailing12mIncomePaise) * 100) : 0;
    const concentrationExceeded = maxFunderPercent > 25;

    let displayFunderName = maxFunderKey;
    if (maxFunderKey.startsWith('donor_')) {
      displayFunderName = 'Individual Contributor';
    }

    // Monthly sorted list
    const monthlyBreakdown = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        incomePaise: data.incomePaise,
        expensePaise: data.expensePaise,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // FY sorted list
    const financialYearBreakdown = Object.entries(fyMap)
      .map(([fy, data]) => ({
        fy,
        incomePaise: data.incomePaise,
        expensePaise: data.expensePaise,
      }))
      .sort((a, b) => b.fy.localeCompare(a.fy));

    // Sort recent entries
    allEntriesForTimeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    const donorCount = paidDonations.length;
    const totalDonationsPaise = incomeByCategory.donations || 0;
    const averageDonationPaise = donorCount > 0 ? Math.round(totalDonationsPaise / donorCount) : 0;

    return {
      totals: {
        totalIncomePaise,
        totalExpensePaise,
        netBalancePaise: totalIncomePaise - totalExpensePaise,
        donorCount,
        averageDonationPaise,
      },
      concentration: {
        trailing12mIncomePaise,
        concentrationExceeded,
        maxFunderName: concentrationExceeded ? displayFunderName : undefined,
        maxFunderPercent,
      },
      incomeByCategory,
      expenseByCategory,
      monthlyBreakdown,
      financialYearBreakdown,
      recentEntries: allEntriesForTimeline.slice(0, 50),
    };
  }

  /**
   * Generates public CSV ledger export
   */
  static async exportLedgerCsv(): Promise<string> {
    const summary = await this.getPublicLedger();
    const rows = [
      ['Date', 'Type', 'Category', 'Description', 'Amount (INR)', 'Source/Vendor'].join(','),
    ];

    for (const item of summary.recentEntries) {
      const dateStr = item.date.toISOString().slice(0, 10);
      const inrStr = paiseToRupees(item.amountPaise).toFixed(2);
      const cleanDesc = `"${item.description.replace(/"/g, '""')}"`;
      const cleanSource = item.sourceName ? `"${item.sourceName.replace(/"/g, '""')}"` : '""';

      rows.push([
        dateStr,
        item.type.toUpperCase(),
        item.category,
        cleanDesc,
        inrStr,
        cleanSource,
      ].join(','));
    }

    return rows.join('\n');
  }

  /**
   * Creates an administrative ledger entry (expenses, CA audit fees, grants, etc.)
   */
  static async createEntry(
    input: CreateFinanceEntryInput,
    adminUserId: string
  ): Promise<IFinanceEntry> {
    const validated = CreateFinanceEntrySchema.parse(input);
    const fy = getFinancialYear(validated.date);

    const entry = await FinanceEntry.create({
      ...validated,
      financialYear: fy,
      createdBy: new mongoose.Types.ObjectId(adminUserId),
    });

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUserId),
      actorRole: 'admin',
      action: 'FINANCE_ENTRY_CREATED',
      targetType: 'FinanceEntry',
      targetId: entry._id.toString(),
      details: {
        type: entry.type,
        category: entry.category,
        amountPaise: entry.amountPaise,
        financialYear: fy,
      },
    });

    return entry;
  }

  /**
   * Deletes an admin ledger entry
   */
  static async deleteEntry(id: string, adminUserId: string): Promise<boolean> {
    const entry = await FinanceEntry.findById(id);
    if (!entry) return false;

    await entry.deleteOne();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUserId),
      actorRole: 'admin',
      action: 'FINANCE_ENTRY_DELETED',
      targetType: 'FinanceEntry',
      targetId: id,
      details: {
        type: entry.type,
        category: entry.category,
        amountPaise: entry.amountPaise,
      },
    });

    return true;
  }
}
