import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { FinanceService, CreateFinanceEntrySchema } from './finance.service.js';
import { FinanceEntry } from '../../models/FinanceEntry.js';
import { Donation } from '../../models/Donation.js';
import { Invoice } from '../../models/Invoice.js';
import { AuditLog } from '../../models/AuditLog.js';

describe('Phase 4: Public Financial Transparency & Finance Ledger', () => {
  describe('1. Zod Validation for Manual Ledger Entries', () => {
    it('rejects entries with negative or zero paise amounts', () => {
      const result = CreateFinanceEntrySchema.safeParse({
        type: 'expense',
        category: 'hosting',
        amountPaise: 0,
        date: new Date(),
        description: 'Monthly cloud hosting',
      });
      assert.equal(result.success, false);
    });

    it('validates required fields and categories', () => {
      const result = CreateFinanceEntrySchema.safeParse({
        type: 'expense',
        category: 'hosting',
        amountPaise: 1500000,
        date: '2026-09-15',
        description: 'Server cluster hosting',
        sourceName: 'AWS Cloud',
      });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.amountPaise, 1500000);
        assert.ok(result.data.date instanceof Date);
      }
    });
  });

  describe('2. Automated Aggregation & Public Ledger Compilation', () => {
    it('aggregates revenues from paid donations, paid invoices and manual expenses', async () => {
      const mockDonations = [
        {
          amountPaise: 100000, // ₹1,000
          status: 'paid',
          type: 'one_time',
          createdAt: new Date('2026-06-10T10:00:00Z'),
          paidAt: new Date('2026-06-10T10:00:00Z'),
        },
        {
          amountPaise: 250000, // ₹2,500
          status: 'paid',
          type: 'recurring',
          createdAt: new Date('2026-07-10T10:00:00Z'),
          paidAt: new Date('2026-07-10T10:00:00Z'),
        },
      ];

      const mockInvoices = [
        {
          totalPaise: 500000, // ₹5,000
          status: 'paid',
          buyerName: 'Pimpri Municipal Field Agency',
          lineItems: [{ description: 'Office Pro Subscription' }],
          createdAt: new Date('2026-08-01T10:00:00Z'),
          paidAt: new Date('2026-08-01T10:00:00Z'),
        },
      ];

      const mockManualEntries = [
        {
          type: 'expense',
          category: 'hosting',
          amountPaise: 300000, // ₹3,000
          date: new Date('2026-08-15T10:00:00Z'),
          description: 'Production cluster hosting',
          sourceName: 'AWS',
          isPublic: true,
        },
      ];

      const originalDonationFind = Donation.find;
      const originalInvoiceFind = Invoice.find;
      const originalFinanceFind = FinanceEntry.find;

      try {
        Donation.find = (() => ({
          sort: () => ({
            lean: () => Promise.resolve(mockDonations),
          }),
        })) as any;

        Invoice.find = (() => ({
          sort: () => ({
            lean: () => Promise.resolve(mockInvoices),
          }),
        })) as any;

        FinanceEntry.find = (() => ({
          sort: () => ({
            lean: () => Promise.resolve(mockManualEntries),
          }),
        })) as any;

        const ledger = await FinanceService.getPublicLedger();

        // Total income: 1,00,000 + 2,50,000 + 5,00,000 = 8,50,000 paise
        assert.equal(ledger.totals.totalIncomePaise, 850000);
        // Total expenses: 3,00,000 paise
        assert.equal(ledger.totals.totalExpensePaise, 300000);
        // Net balance: 8,50,000 - 3,00,000 = 5,50,000 paise
        assert.equal(ledger.totals.netBalancePaise, 550000);

        // Donors count
        assert.equal(ledger.totals.donorCount, 2);
        assert.equal(ledger.incomeByCategory.donations, 350000);
        assert.equal(ledger.incomeByCategory.subscriptions, 500000);
        assert.equal(ledger.expenseByCategory.hosting, 300000);
      } finally {
        Donation.find = originalDonationFind;
        Invoice.find = originalInvoiceFind;
        FinanceEntry.find = originalFinanceFind;
      }
    });
  });

  describe('3. Trailing 12-Month Concentration Ratio Safeguard', () => {
    it('flags funder concentration when a single entity exceeds 25% of trailing revenue', async () => {
      const now = new Date();
      const mockInvoices = [
        {
          totalPaise: 8000000, // ₹80,000 (80% of 1,00,000)
          status: 'paid',
          buyerName: 'Single Large Donor Trust',
          lineItems: [{ description: 'Institutional Grant Tier' }],
          createdAt: now,
          paidAt: now,
        },
        {
          totalPaise: 2000000, // ₹20,000 (20%)
          status: 'paid',
          buyerName: 'Other Contributor',
          lineItems: [{ description: 'Pro Tier' }],
          createdAt: now,
          paidAt: now,
        },
      ];

      const originalDonationFind = Donation.find;
      const originalInvoiceFind = Invoice.find;
      const originalFinanceFind = FinanceEntry.find;

      try {
        Donation.find = (() => ({
          sort: () => ({ lean: () => Promise.resolve([]) }),
        })) as any;

        Invoice.find = (() => ({
          sort: () => ({ lean: () => Promise.resolve(mockInvoices) }),
        })) as any;

        FinanceEntry.find = (() => ({
          sort: () => ({ lean: () => Promise.resolve([]) }),
        })) as any;

        const ledger = await FinanceService.getPublicLedger();
        assert.equal(ledger.concentration.concentrationExceeded, true);
        assert.equal(ledger.concentration.maxFunderPercent, 80);
        assert.equal(ledger.concentration.maxFunderName, 'Single Large Donor Trust');
      } finally {
        Donation.find = originalDonationFind;
        Invoice.find = originalInvoiceFind;
        FinanceEntry.find = originalFinanceFind;
      }
    });

    it('verifies decentralized funding when no funder exceeds 25%', async () => {
      const now = new Date();
      const mockDonations = [
        { amountPaise: 100000, status: 'paid', createdAt: now, paidAt: now },
        { amountPaise: 100000, status: 'paid', createdAt: now, paidAt: now },
        { amountPaise: 100000, status: 'paid', createdAt: now, paidAt: now },
        { amountPaise: 100000, status: 'paid', createdAt: now, paidAt: now },
        { amountPaise: 100000, status: 'paid', createdAt: now, paidAt: now },
      ];

      const originalDonationFind = Donation.find;
      const originalInvoiceFind = Invoice.find;
      const originalFinanceFind = FinanceEntry.find;

      try {
        Donation.find = (() => ({
          sort: () => ({ lean: () => Promise.resolve(mockDonations) }),
        })) as any;

        Invoice.find = (() => ({
          sort: () => ({ lean: () => Promise.resolve([]) }),
        })) as any;

        FinanceEntry.find = (() => ({
          sort: () => ({ lean: () => Promise.resolve([]) }),
        })) as any;

        const ledger = await FinanceService.getPublicLedger();
        // Individual donors are pooled into grassroot contributions
        assert.equal(ledger.concentration.concentrationExceeded, false);
      } finally {
        Donation.find = originalDonationFind;
        Invoice.find = originalInvoiceFind;
        FinanceEntry.find = originalFinanceFind;
      }
    });
  });

  describe('4. Public CSV Ledger Export', () => {
    it('formats ledger entries as clean CSV rows with headers', async () => {
      const originalGetLedger = FinanceService.getPublicLedger;
      try {
        FinanceService.getPublicLedger = (() =>
          Promise.resolve({
            totals: { totalIncomePaise: 10000, totalExpensePaise: 5000, netBalancePaise: 5000, donorCount: 1, averageDonationPaise: 10000 },
            concentration: { trailing12mIncomePaise: 10000, concentrationExceeded: false, maxFunderPercent: 10 },
            incomeByCategory: {},
            expenseByCategory: {},
            monthlyBreakdown: [],
            financialYearBreakdown: [],
            recentEntries: [
              {
                date: new Date('2026-09-01T00:00:00Z'),
                type: 'expense',
                category: 'sms',
                description: 'OTP gateway dispatch fees',
                amountPaise: 50000,
                sourceName: 'Gupshup SMS',
              },
            ],
          })) as any;

        const csv = await FinanceService.exportLedgerCsv();
        assert.ok(csv.startsWith('Date,Type,Category,Description,Amount (INR),Source/Vendor'));
        assert.ok(csv.includes('2026-09-01'));
        assert.ok(csv.includes('EXPENSE'));
        assert.ok(csv.includes('sms'));
        assert.ok(csv.includes('"OTP gateway dispatch fees"'));
        assert.ok(csv.includes('500.00'));
        assert.ok(csv.includes('"Gupshup SMS"'));
      } finally {
        FinanceService.getPublicLedger = originalGetLedger;
      }
    });
  });

  describe('5. Admin Entry Management & Audit Logging', () => {
    it('creates manual entry and logs to AuditLog', async () => {
      const mockAdminId = new mongoose.Types.ObjectId().toString();
      const mockEntry: any = {
        _id: new mongoose.Types.ObjectId(),
        type: 'expense',
        category: 'legal',
        amountPaise: 450000,
        financialYear: '2026-27',
      };

      const originalCreate = FinanceEntry.create;
      const originalAudit = AuditLog.create;
      let loggedAction = '';

      try {
        FinanceEntry.create = (() => Promise.resolve(mockEntry)) as any;
        AuditLog.create = ((log: any) => {
          loggedAction = log.action;
          return Promise.resolve(log);
        }) as any;

        const created = await FinanceService.createEntry(
          {
            type: 'expense',
            category: 'legal',
            amountPaise: 450000,
            date: new Date('2026-07-01'),
            description: 'DPDP compliance legal counsel retainer',
          },
          mockAdminId
        );

        assert.ok(created);
        assert.equal(created.category, 'legal');
        assert.equal(loggedAction, 'FINANCE_ENTRY_CREATED');
      } finally {
        FinanceEntry.create = originalCreate;
        AuditLog.create = originalAudit;
      }
    });
  });
});
