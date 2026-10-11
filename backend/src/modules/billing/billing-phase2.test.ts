import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { EntitlementsService, BASIC_FEATURES } from '../../services/entitlements.service.js';
import { SubscriptionService } from '../../services/subscription.service.js';
import { InvoiceService } from '../../services/invoice.service.js';
import { Subscription } from '../../models/Subscription.js';
import { Plan } from '../../models/Plan.js';
import { User } from '../../models/User.js';
import { UsageCounter } from '../../models/UsageCounter.js';
import { AuditLog } from '../../models/AuditLog.js';
import { BillingController } from './billing.controller.js';
import { config } from '../../config/env.js';

describe('Phase 2: Subscription Plans, Entitlements & Organization Billing', () => {
  const mockOfficeId = new mongoose.Types.ObjectId();

  describe('1. Rule 3: Office Basic is Free and Always Works', () => {
    it('always permits core civic response features without any subscription check', async () => {
      for (const feature of BASIC_FEATURES) {
        const canUse = await EntitlementsService.can(mockOfficeId, feature);
        assert.equal(canUse, true, `Core feature ${feature} must be unconditionally free`);
      }
    });

    it('denies paid-only internal workflow tools on Basic tier', async () => {
      const originalSubFindOne = Subscription.findOne;
      const originalPlanFindOne = Plan.findOne;

      try {
        Subscription.findOne = (() => ({
          sort: () => Promise.resolve(null),
        })) as any;

        Plan.findOne = (() => Promise.resolve({
          key: 'office_basic',
          features: BASIC_FEATURES,
        })) as any;

        const canUseAssignment = await EntitlementsService.can(mockOfficeId, 'assignment_workflow');
        const canUseSlaBots = await EntitlementsService.can(mockOfficeId, 'sla_automation');
        const canUseAnalytics = await EntitlementsService.can(mockOfficeId, 'analytics_dashboard');

        assert.equal(canUseAssignment, false, 'Assignment workflow requires upgraded plan');
        assert.equal(canUseSlaBots, false, 'SLA automation bots require upgraded plan');
        assert.equal(canUseAnalytics, false, 'Advanced analytics requires upgraded plan');
      } finally {
        Subscription.findOne = originalSubFindOne;
        Plan.findOne = originalPlanFindOne;
      }
    });
  });

  describe('2. Entitlements Service & Plan Resolution', () => {
    it('unlocks paid tools when active subscription is present', async () => {
      const originalSubFindOne = Subscription.findOne;
      const originalPlanFindOne = Plan.findOne;

      try {
        Subscription.findOne = (() => ({
          sort: () => Promise.resolve({
            officeId: mockOfficeId,
            planKey: 'office_pro',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          }),
        })) as any;

        Plan.findOne = (() => Promise.resolve({
          key: 'office_pro',
          features: [...BASIC_FEATURES, 'assignment_workflow', 'sla_automation', 'analytics_dashboard'],
          limits: { seats: 25, exportsPerMonth: 500 },
        })) as any;

        const canUseAssignment = await EntitlementsService.can(mockOfficeId, 'assignment_workflow');
        const canUseSlaBots = await EntitlementsService.can(mockOfficeId, 'sla_automation');

        assert.equal(canUseAssignment, true, 'Active Pro subscription unlocks assignment_workflow');
        assert.equal(canUseSlaBots, true, 'Active Pro subscription unlocks sla_automation');
      } finally {
        Subscription.findOne = originalSubFindOne;
        Plan.findOne = originalPlanFindOne;
      }
    });

    it('enforces seat limits against active approved office members', async () => {
      const originalSubFindOne = Subscription.findOne;
      const originalPlanFindOne = Plan.findOne;
      const originalUserCount = User.countDocuments;

      try {
        Subscription.findOne = (() => ({
          sort: () => Promise.resolve({
            officeId: mockOfficeId,
            seats: 5,
            status: 'active',
          }),
        })) as any;

        Plan.findOne = (() => Promise.resolve({
          key: 'office_pro',
          limits: { seats: 5 },
        })) as any;

        // 4 members active -> allowed
        User.countDocuments = (() => Promise.resolve(4)) as any;
        const check1 = await SubscriptionService.checkSeatLimit(mockOfficeId);
        assert.equal(check1.allowed, true);
        assert.equal(check1.currentMembers, 4);

        // 5 members active -> limit reached
        User.countDocuments = (() => Promise.resolve(5)) as any;
        const check2 = await SubscriptionService.checkSeatLimit(mockOfficeId);
        assert.equal(check2.allowed, false);
        assert.equal(check2.seatLimit, 5);
      } finally {
        Subscription.findOne = originalSubFindOne;
        Plan.findOne = originalPlanFindOne;
        User.countDocuments = originalUserCount;
      }
    });
  });

  describe('3. Rule 4: Safe Lapse & Unmetered Free Data Export', () => {
    it('safely downgrades past_due subscriptions after grace period expires', async () => {
      const originalFind = Subscription.find;
      const originalAuditLogCreate = AuditLog.create;
      const mockLapsedSub = {
        _id: new mongoose.Types.ObjectId(),
        officeId: mockOfficeId,
        status: 'past_due',
        graceUntil: new Date(Date.now() - 3600 * 1000), // 1 hour past grace
        save: async () => {},
      };

      try {
        Subscription.find = (() => Promise.resolve([mockLapsedSub])) as any;
        AuditLog.create = (() => Promise.resolve({})) as any;

        const count = await SubscriptionService.checkAndProcessLapsedSubscriptions();
        assert.equal(count, 1);
        assert.equal(mockLapsedSub.status, 'expired', 'Lapsed sub must transition to expired');
      } finally {
        Subscription.find = originalFind;
        AuditLog.create = originalAuditLogCreate;
      }
    });
  });

  describe('4. Tax Breakdown & Invoice Integrity', () => {
    it('computes CGST + SGST for intra-state supply (Maharashtra)', () => {
      const subtotalPaise = 100000; // ₹1,000
      const taxes = InvoiceService.computeTaxes(subtotalPaise, 'Maharashtra');

      assert.equal(taxes.cgstPaise, 9000); // 9% = ₹90
      assert.equal(taxes.sgstPaise, 9000); // 9% = ₹90
      assert.equal(taxes.igstPaise, 0);
      assert.equal(subtotalPaise + taxes.cgstPaise + taxes.sgstPaise, 118000);
    });

    it('computes IGST for inter-state supply (outside Maharashtra)', () => {
      const subtotalPaise = 100000; // ₹1,000
      const taxes = InvoiceService.computeTaxes(subtotalPaise, 'Karnataka');

      assert.equal(taxes.cgstPaise, 0);
      assert.equal(taxes.sgstPaise, 0);
      assert.equal(taxes.igstPaise, 18000); // 18% = ₹180
      assert.equal(subtotalPaise + taxes.igstPaise, 118000);
    });
  });

  describe('5. Object-Level Authorization (IDOR Protection)', () => {
    it('blocks an office admin from accessing another office’s billing details', () => {
      const officeA = '67aa00000000000000000001';
      const officeB = '67aa00000000000000000002';

      const mockOfficerA: any = {
        user: {
          userId: 'user_1',
          role: 'official',
          officeMemberships: [{ officeId: officeA, memberRole: 'office_admin', status: 'active' }],
        },
      };

      // Officer A accessing Office A -> Allowed
      assert.equal(BillingController.isOfficeAdmin(mockOfficerA, officeA), true);

      // Officer A attempting to access Office B -> Denied
      assert.equal(BillingController.isOfficeAdmin(mockOfficerA, officeB), false);
    });

    it('allows super admin unrestricted access to all office billing records', () => {
      const officeB = '67aa00000000000000000002';
      const mockSuperAdmin: any = {
        user: {
          userId: 'admin_1',
          role: 'admin',
        },
      };
      assert.equal(BillingController.isOfficeAdmin(mockSuperAdmin, officeB), true);
    });
  });
});
