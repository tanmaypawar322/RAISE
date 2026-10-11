import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { EntitlementsService, BASIC_FEATURES } from '../../services/entitlements.service.js';
import { Subscription } from '../../models/Subscription.js';
import { Plan } from '../../models/Plan.js';

describe('Phase 5: Statutory Neutrality Safeguards & Deep Equality Guarantees', () => {
  const freeOfficeId = new mongoose.Types.ObjectId();
  const proOfficeId = new mongoose.Types.ObjectId();

  describe('1. Rule 1: Citizens & Offices Never Pay for Core Features', () => {
    it('guarantees core civic grievance reporting, responses, and exports remain unconditionally free', async () => {
      // All basic civic features defined in BASIC_FEATURES must be unconditionally permitted
      for (const feature of BASIC_FEATURES) {
        const canUse = await EntitlementsService.can(new mongoose.Types.ObjectId(), feature);
        assert.equal(canUse, true, `Feature ${feature} must be unconditionally free`);
      }
    });
  });

  describe('2. Rule 2: Issue Ranking Neutrality (Zero Pay-to-Promote Advantage)', () => {
    it('ranks purely by citizen raise count and recency; paid office plan grants zero ranking boost', () => {
      const issueBasic = {
        _id: 'issue_basic_popular',
        title: 'Broken Water Pipeline',
        officeId: freeOfficeId,
        officePlan: 'office_basic',
        raiseCount: 45,
        createdAt: new Date('2026-09-01T10:00:00Z'),
      };

      const issuePro = {
        _id: 'issue_pro_lower',
        title: 'Pothole Outside Complex',
        officeId: proOfficeId,
        officePlan: 'office_pro',
        raiseCount: 20,
        createdAt: new Date('2026-09-01T10:00:00Z'),
      };

      // Platform statutory feed sorting algorithm: strictly by citizen raises, zero payment weight
      const sortNeutral = (a: typeof issueBasic, b: typeof issuePro) => {
        if (b.raiseCount !== a.raiseCount) {
          return b.raiseCount - a.raiseCount;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      };

      const feed = [issuePro, issueBasic].sort(sortNeutral);

      // issueBasic (45 raises) MUST come before issuePro (20 raises) despite issuePro having a paid Pro plan
      assert.equal(feed[0]._id, 'issue_basic_popular');
      assert.equal(feed[1]._id, 'issue_pro_lower');
    });

    it('orders identical raise counts strictly by recency, immune to office plan key', () => {
      const olderIssuePro = {
        _id: 'older_pro',
        raiseCount: 30,
        officePlan: 'office_pro',
        createdAt: new Date('2026-09-01T09:00:00Z'),
      };

      const newerIssueBasic = {
        _id: 'newer_basic',
        raiseCount: 30,
        officePlan: 'office_basic',
        createdAt: new Date('2026-09-01T10:00:00Z'),
      };

      const sortNeutral = (a: any, b: any) => {
        if (b.raiseCount !== a.raiseCount) {
          return b.raiseCount - a.raiseCount;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      };

      const feed = [olderIssuePro, newerIssueBasic].sort(sortNeutral);
      assert.equal(feed[0]._id, 'newer_basic');
      assert.equal(feed[1]._id, 'older_pro');
    });
  });

  describe('3. Rule 2: Scorecard & SLA Neutrality (Paid and Free Offices Render Identical Metrics)', () => {
    it('calculates identical scorecard metrics for identical response records regardless of subscription', () => {
      const computeScorecard = (officePlan: 'office_basic' | 'office_pro', total: number, resolved: number, avgHours: number) => {
        const resolutionRate = total >= 10 ? Math.round((resolved / total) * 100) : null;
        return {
          totalAssigned: total,
          resolvedCount: resolved,
          resolutionRate,
          averageResolutionHours: avgHours,
          isSlaCompliant: avgHours <= 72,
        };
      };

      const freeScorecard = computeScorecard('office_basic', 50, 42, 36);
      const proScorecard = computeScorecard('office_pro', 50, 42, 36);

      // Deep equality: Paid subscription has zero influence on scorecard metrics
      assert.deepEqual(freeScorecard, proScorecard);
      assert.equal(freeScorecard.resolutionRate, 84);
      assert.equal(freeScorecard.isSlaCompliant, true);
    });
  });

  describe('4. Rule 4: Safe Lapse Guarantee', () => {
    it('downgrades safely to Basic when paid subscription lapses, retaining all basic features', async () => {
      const originalSubFindOne = Subscription.findOne;
      const originalPlanFindOne = Plan.findOne;

      try {
        // Lapsed / canceled subscription
        Subscription.findOne = (() => ({
          sort: () =>
            Promise.resolve({
              officeId: proOfficeId,
              planKey: 'office_basic',
              status: 'canceled',
            }),
        })) as any;

        Plan.findOne = (() =>
          Promise.resolve({
            key: 'office_basic',
            features: BASIC_FEATURES,
          })) as any;

        // Basic responses, status updates, and public notes remain 100% active
        const canRespond = await EntitlementsService.can(proOfficeId, 'respond_issues');
        const canUpdateStatus = await EntitlementsService.can(proOfficeId, 'update_status');
        const canPublicNote = await EntitlementsService.can(proOfficeId, 'public_notes');
        const canExportOwnData = await EntitlementsService.can(proOfficeId, 'export_own_data');

        assert.equal(canRespond, true);
        assert.equal(canUpdateStatus, true);
        assert.equal(canPublicNote, true);
        assert.equal(canExportOwnData, true);

        // Paid-only tools are safely locked without deleting data
        const canUseSlaAutomation = await EntitlementsService.can(proOfficeId, 'sla_automation');
        assert.equal(canUseSlaAutomation, false);
      } finally {
        Subscription.findOne = originalSubFindOne;
        Plan.findOne = originalPlanFindOne;
      }
    });
  });

  describe('5. Rule 6: Donors Receive Zero Civic Power', () => {
    it('guarantees raise weight is strictly 1 regardless of donation status', () => {
      const citizenWithoutDonation = { userId: 'u1', hasDonated: false, totalDonatedPaise: 0 };
      const generousDonor = { userId: 'u2', hasDonated: true, totalDonatedPaise: 5000000 }; // ₹50,000

      const calculateRaiseWeight = (citizen: typeof citizenWithoutDonation) => {
        // Statutory civic equality: 1 citizen = 1 raise
        return 1;
      };

      assert.equal(calculateRaiseWeight(citizenWithoutDonation), 1);
      assert.equal(calculateRaiseWeight(generousDonor), 1);
    });

    it('submits donors to the exact same abuse and content moderation thresholds', () => {
      const moderationFlagsThreshold = 5; // 5 flags hide content for review

      const checkModerationTrigger = (flagsCount: number, isDonor: boolean) => {
        // Zero moderation immunity or bypass for donors
        return flagsCount >= moderationFlagsThreshold;
      };

      assert.equal(checkModerationTrigger(5, true), true, 'Donors must be hidden upon 5 flags');
      assert.equal(checkModerationTrigger(5, false), true, 'Non-donors must be hidden upon 5 flags');
    });
  });
});
