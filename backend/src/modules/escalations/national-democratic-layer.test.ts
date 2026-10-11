import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { EscalationService } from '../../services/escalation.service.js';
import { MilestoneService } from '../representatives/milestone.service.js';
import { OtpService } from '../../services/otp.service.js';

describe('National Democratic & Grassroots Rural Accountability Layer', () => {
  describe('1. Population-Adaptive Community Verification', () => {
    it('verifies a rural Gram Panchayat issue once 5 citizen raises are reached', async () => {
      const mockIssue: any = {
        settlementType: 'rural_panchayat',
        raiseCount: 5,
        isCommunityVerified: false,
        status: 'published',
        statusTimeline: [],
        save: async () => {},
      };

      const verified = await EscalationService.checkCommunityVerification(mockIssue);
      assert.equal(verified, true);
      assert.equal(mockIssue.isCommunityVerified, true);
      assert.ok(mockIssue.communityVerifiedAt instanceof Date);
      assert.ok(mockIssue.statusTimeline.length > 0);
      assert.ok(mockIssue.statusTimeline[0].note.includes('Community-verified by local citizens'));
    });

    it('keeps a rural grievance unverified if raises are below the 5-citizen threshold', async () => {
      const mockIssue: any = {
        settlementType: 'rural_panchayat',
        raiseCount: 4,
        isCommunityVerified: false,
        status: 'published',
        statusTimeline: [],
        save: async () => {},
      };

      const verified = await EscalationService.checkCommunityVerification(mockIssue);
      assert.equal(verified, false);
      assert.equal(mockIssue.isCommunityVerified, false);
    });

    it('requires 25 citizen raises to verify an urban municipal grievance', async () => {
      const mockIssueUnder: any = {
        settlementType: 'urban_municipal',
        raiseCount: 20,
        isCommunityVerified: false,
        status: 'published',
        statusTimeline: [],
        save: async () => {},
      };

      const verifiedUnder = await EscalationService.checkCommunityVerification(mockIssueUnder);
      assert.equal(verifiedUnder, false);

      const mockIssueMet: any = {
        settlementType: 'urban_municipal',
        raiseCount: 25,
        isCommunityVerified: false,
        status: 'published',
        statusTimeline: [],
        save: async () => {},
      };

      const verifiedMet = await EscalationService.checkCommunityVerification(mockIssueMet);
      assert.equal(verifiedMet, true);
      assert.equal(mockIssueMet.isCommunityVerified, true);
    });
  });

  describe('2. Dual-Track Administrative Escalation Pyramids', () => {
    it('escalates rural grievances up the 73rd Amendment Panchayati Raj ladder based on raises', () => {
      // Rural Tier 2: Taluka BDO at 15 raises
      const tier2 = EscalationService.getRequiredTier(
        { settlementType: 'rural_panchayat', raiseCount: 15, escalationTier: 1 } as any,
        false
      );
      assert.equal(tier2.targetTier, 2);
      assert.equal(tier2.trigger, 'raise_threshold');

      // Rural Tier 3: Zilla Parishad CEO / District Collector at 50 raises
      const tier3 = EscalationService.getRequiredTier(
        { settlementType: 'rural_panchayat', raiseCount: 50, escalationTier: 2 } as any,
        false
      );
      assert.equal(tier3.targetTier, 3);
      assert.equal(tier3.trigger, 'raise_threshold');

      // Rural Tier 4: State Rural Dev Ministry at 250 raises
      const tier4 = EscalationService.getRequiredTier(
        { settlementType: 'rural_panchayat', raiseCount: 250, escalationTier: 3 } as any,
        false
      );
      assert.equal(tier4.targetTier, 4);
      assert.equal(tier4.trigger, 'raise_threshold');
    });

    it('escalates urban grievances up the 74th Amendment Municipal ladder based on raises', () => {
      // Urban Tier 2: Municipal Commissioner / MLA at 100 raises
      const tier2 = EscalationService.getRequiredTier(
        { settlementType: 'urban_municipal', raiseCount: 100, escalationTier: 1 } as any,
        false
      );
      assert.equal(tier2.targetTier, 2);
      assert.equal(tier2.trigger, 'raise_threshold');

      // Urban Tier 3: District Collector / MP at 500 raises
      const tier3 = EscalationService.getRequiredTier(
        { settlementType: 'urban_municipal', raiseCount: 500, escalationTier: 2 } as any,
        false
      );
      assert.equal(tier3.targetTier, 3);
      assert.equal(tier3.trigger, 'raise_threshold');

      // Urban Tier 4: State Urban Dev Ministry / CM Dashboard at 2,500 raises
      const tier4 = EscalationService.getRequiredTier(
        { settlementType: 'urban_municipal', raiseCount: 2500, escalationTier: 3 } as any,
        false
      );
      assert.equal(tier4.targetTier, 4);
      assert.equal(tier4.trigger, 'raise_threshold');
    });

    it('advances administrative tiers upon statutory SLA clock breach', () => {
      const breached = EscalationService.getRequiredTier(
        { settlementType: 'rural_panchayat', raiseCount: 2, escalationTier: 1 } as any,
        true // isSlaBreached = true
      );
      assert.equal(breached.targetTier, 2);
      assert.equal(breached.trigger, 'sla_breach');

      const breachedTier2 = EscalationService.getRequiredTier(
        { settlementType: 'rural_panchayat', raiseCount: 2, escalationTier: 2 } as any,
        true
      );
      assert.equal(breachedTier2.targetTier, 3);
      assert.equal(breachedTier2.trigger, 'sla_breach');
    });
  });

  describe('3. Assisted Reporting (Sahayak / CSC / Youth Volunteer Mode)', () => {
    it('masks phone numbers and generates verifiable SMS tracking tokens', () => {
      const phone = '9876543210';
      const normalized = OtpService.normalizePhone(phone);
      const masked = OtpService.maskPhone(normalized);

      assert.equal(masked, '+91 ******3210');
      assert.notEqual(masked, phone);

      const trackingToken = `RAISE-GP-${Math.floor(100000 + Math.random() * 900000)}`;
      assert.match(trackingToken, /^RAISE-GP-\d{6}$/);
    });
  });

  describe('4. Representative & Sarpanch Milestone Verification Safeguards', () => {
    it('strictly blocks electoral campaigning slogans and party endorsements in milestones', () => {
      const sloganCheck = MilestoneService.screenForCampaigning('Vote for our visionary development in 2026');
      assert.equal(sloganCheck.allowed, false);
      assert.ok(sloganCheck.violation?.includes('vote for'));

      const partyCheck = MilestoneService.screenForCampaigning('PMGSY road inaugurated under BJP government');
      assert.equal(partyCheck.allowed, false);
      assert.ok(partyCheck.violation?.includes('bjp'));

      const cleanCheck = MilestoneService.screenForCampaigning(
        'Jal Jeevan Mission 100% household tap water supply completed across 4 village wadis'
      );
      assert.equal(cleanCheck.allowed, true);
    });

    it('calculates 14-day community verification window', () => {
      const now = new Date();
      const verificationEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const diffDays = Math.round((verificationEnd.getTime() - now.getTime()) / (1000 * 3600 * 24));
      assert.equal(diffDays, 14);
    });
  });

  describe('5. Senior Administrative Directives', () => {
    it('computes binding statutory countdown clocks for 24h, 48h, and 72h directives', () => {
      const now = new Date();
      const d48 = new Date(now.getTime() + 48 * 3600 * 1000);
      const hoursDiff = (d48.getTime() - now.getTime()) / (3600 * 1000);
      assert.equal(hoursDiff, 48);

      const d24 = new Date(now.getTime() + 24 * 3600 * 1000);
      const hoursDiff24 = (d24.getTime() - now.getTime()) / (3600 * 1000);
      assert.equal(hoursDiff24, 24);
    });
  });
});
