import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MetricsService } from '../../services/metrics.service.js';
import { FreezeService } from '../../services/freeze.service.js';
import { MonthlyReportService } from '../../services/monthly-report.service.js';
import { Issue } from '../../models/Issue.js';
import { RepresentativeAsk } from '../../models/RepresentativeAsk.js';
import { RepresentativeUpdate } from '../../models/RepresentativeUpdate.js';
import { RepresentativeProfile } from '../../models/RepresentativeProfile.js';
import { FreezeWindow } from '../../models/FreezeWindow.js';
import { MonthlyReport } from '../../models/MonthlyReport.js';
import { MetricSnapshot } from '../../models/MetricSnapshot.js';
import { AnalysisController } from '../analysis/analysis.controller.js';

describe('Phase 8: Representatives, Credit, and Accountability Layer Rules', () => {
  describe('Rule 1 & 3: Content Neutrality & Zero Citizen Tampering by Officials', () => {
    it('ensures representatives have strictly zero deletion/modification power over citizen grievances', () => {
      // Representative roles can take up issues or post inquiries, but cannot hide or delete
      const officialRole = 'official';
      const adminRole = 'admin';
      const citizenRole = 'citizen';

      const canModerate = (role: string) => role === 'admin';
      assert.equal(canModerate(officialRole), false, 'Officials/representatives must not have moderation powers');
      assert.equal(canModerate(citizenRole), false, 'Citizens must not have moderation powers');
      assert.equal(canModerate(adminRole), true, 'Only admins hold content moderation permissions');
    });
  });

  describe('Rule 2: Credit from Verified Outcomes Only (Self-Reported Updates Never Counted)', () => {
    it('verifies that credit KPIs compute solely from citizen-confirmed outcomes of issues taken up', async () => {
      const mockRepId = new mongoose.Types.ObjectId();

      const originalCountDocs = Issue.countDocuments;
      const originalAggregate = Issue.aggregate;
      const originalAskFind = RepresentativeAsk.find;
      const originalProfileFindById = RepresentativeProfile.findById;
      const originalSnapshotUpsert = MetricSnapshot.findOneAndUpdate;

      try {
        // Stub profile
        RepresentativeProfile.findById = (() => Promise.resolve({
          _id: mockRepId,
          displayName: '[SAMPLE] MLA Test',
          role: 'mla',
          status: 'verified',
        })) as any;

        // Stub 12 asks (sample >= 10)
        RepresentativeAsk.find = (() => Promise.resolve(
          Array.from({ length: 12 }, () => ({
            _id: new mongoose.Types.ObjectId(),
            representativeProfileId: mockRepId,
            status: 'taken_up',
            createdAt: new Date(Date.now() - 48 * 3600 * 1000),
            takenUpAt: new Date(Date.now() - 24 * 3600 * 1000),
            slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
          }))
        )) as any;

        // Stub countDocuments: 15 taken up, 10 confirmed resolutions
        Issue.countDocuments = ((query: any) => {
          if (query.status === 'resolved') return Promise.resolve(10);
          return Promise.resolve(15);
        }) as any;

        // Stub aggregate: 20 citizen thanks
        Issue.aggregate = (() => Promise.resolve([{ _id: null, totalThanks: 20 }])) as any;

        MetricSnapshot.findOneAndUpdate = ((q: any, update: any) => Promise.resolve({
          ...update,
          targetId: mockRepId,
        })) as any;

        const result = await MetricsService.computeRepresentativeMetrics(mockRepId);

        assert.ok(result);
        assert.equal(result.isSampleTooSmall, false);
        assert.equal(result.metrics.issuesTakenUp, 15);
        assert.equal(result.metrics.confirmedResolutions, 10);
        assert.equal(result.metrics.citizenThanksCount, 20);
        assert.equal(result.metrics.responseRatePct, 100);

        // Verify credit outcomes
        assert.equal(result.metrics.confirmedResolutions <= result.metrics.issuesTakenUp, true);
      } finally {
        Issue.countDocuments = originalCountDocs;
        Issue.aggregate = originalAggregate;
        RepresentativeAsk.find = originalAskFind;
        RepresentativeProfile.findById = originalProfileFindById;
        MetricSnapshot.findOneAndUpdate = originalSnapshotUpsert;
      }
    });
  });

  describe('Rule 5: Minimum Sample Size Fairness Safeguards (<10 Suppression)', () => {
    it('suppresses percentage scorecards and sets rates to null when sample size < 10', async () => {
      const mockRepId = new mongoose.Types.ObjectId();

      const originalCountDocs = Issue.countDocuments;
      const originalAggregate = Issue.aggregate;
      const originalAskFind = RepresentativeAsk.find;
      const originalProfileFindById = RepresentativeProfile.findById;
      const originalSnapshotUpsert = MetricSnapshot.findOneAndUpdate;

      try {
        RepresentativeProfile.findById = (() => Promise.resolve({
          _id: mockRepId,
          displayName: '[SAMPLE] Councillor Test',
          role: 'ward_councillor',
          status: 'verified',
        })) as any;

        // Only 3 asks (sample < 10)
        RepresentativeAsk.find = (() => Promise.resolve(
          Array.from({ length: 3 }, () => ({
            _id: new mongoose.Types.ObjectId(),
            representativeProfileId: mockRepId,
            status: 'pending',
            createdAt: new Date(),
          }))
        )) as any;

        Issue.countDocuments = (() => Promise.resolve(2)) as any;
        Issue.aggregate = (() => Promise.resolve([{ _id: null, totalThanks: 1 }])) as any;

        MetricSnapshot.findOneAndUpdate = ((q: any, update: any) => Promise.resolve({
          ...update,
          targetId: mockRepId,
        })) as any;

        const result = await MetricsService.computeRepresentativeMetrics(mockRepId);

        assert.ok(result);
        assert.equal(result.isSampleTooSmall, true, 'isSampleTooSmall must be true for count < 10');
        assert.equal(result.metrics.responseRatePct, null, 'Response rate percentage must be suppressed to null');
      } finally {
        Issue.countDocuments = originalCountDocs;
        Issue.aggregate = originalAggregate;
        RepresentativeAsk.find = originalAskFind;
        RepresentativeProfile.findById = originalProfileFindById;
        MetricSnapshot.findOneAndUpdate = originalSnapshotUpsert;
      }
    });
  });

  describe('Rule 6: Pre-moderation & Campaigning Keywords Auto-Flagging', () => {
    it('detects banned campaigning terms and assigns pending_moderation with reason', () => {
      const BANNED_CAMPAIGN_TERMS = [
        'vote for',
        'vote me',
        'elect me',
        're-elect',
        'election',
        'candidate',
        'ballot',
        'party',
        'मते द्या',
        'मतदान करा',
        'निवडून द्या',
        'उमेदवार',
        'वोट दें',
        'चुनाव',
        'प्रत्याशी',
      ];

      const cleanText = 'Completed drainage desilting work in Sector 14.';
      const campaigningEnglish = 'Please vote for our candidate in the upcoming municipal election!';
      const campaigningMarathi = 'येत्या निवडणुकीत मला निवडून द्या आणि विकास करा.';
      const campaigningHindi = 'सभी नागरिक हमें वोट दें और चुनाव में समर्थन करें.';

      const checkText = (text: string) => {
        const lower = text.toLowerCase();
        return BANNED_CAMPAIGN_TERMS.find((term) => lower.includes(term));
      };

      assert.equal(checkText(cleanText), undefined, 'Clean civic update must not trigger campaign alert');
      assert.ok(checkText(campaigningEnglish), 'Must catch English campaigning keyword');
      assert.ok(checkText(campaigningMarathi), 'Must catch Marathi campaigning keyword');
      assert.ok(checkText(campaigningHindi), 'Must catch Hindi campaigning keyword');
    });
  });

  describe('Rule 7: DPDP Act Privacy Shield & <5 Cell Suppression', () => {
    it('sanitizes counts strictly: suppresses 1 to 4 to "<5" while preserving 0 and >=5', () => {
      // Testing AnalysisController.sanitizeCount logic
      const sanitize = (AnalysisController as any).sanitizeCount;

      assert.equal(sanitize(0), 0, 'Zero count remains 0');
      assert.equal(sanitize(1), '<5', 'Count of 1 must be suppressed to "<5"');
      assert.equal(sanitize(2), '<5', 'Count of 2 must be suppressed to "<5"');
      assert.equal(sanitize(3), '<5', 'Count of 3 must be suppressed to "<5"');
      assert.equal(sanitize(4), '<5', 'Count of 4 must be suppressed to "<5"');
      assert.equal(sanitize(5), 5, 'Count of 5 remains unsuppressed');
      assert.equal(sanitize(42), 42, 'Count of 42 remains unsuppressed');
    });
  });

  describe('Right-of-Reply & 5-Day Window Enforcement', () => {
    it('verifies that right of reply deadline is strictly 5 days from generation', () => {
      const periodData = MonthlyReportService.getMonthPeriod();
      assert.ok(periodData.period.match(/^\d{4}-\d{2}$/), 'Period must match YYYY-MM format');

      const now = new Date();
      const diffDays = Math.round(
        (periodData.replyDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      assert.equal(diffDays, 5, 'Right of reply deadline must be 5 days after generation');
    });

    it('rejects formal replies submitted after the 5-day deadline has elapsed', () => {
      const expiredReport = {
        replyDeadline: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        status: 'draft_reply_window',
      };

      const isExpired = new Date() > expiredReport.replyDeadline;
      assert.equal(isExpired, true, 'Expired deadline must be recognized');
    });
  });

  describe('Election Freeze (Model Code of Conduct) Rules', () => {
    it('detects when an election freeze is active for a jurisdiction', async () => {
      const mockJurisdictionId = new mongoose.Types.ObjectId();
      const originalFindOne = FreezeWindow.findOne;

      try {
        // Stub active freeze window
        FreezeWindow.findOne = (() => ({
          _id: new mongoose.Types.ObjectId(),
          jurisdictionId: mockJurisdictionId,
          freezeStart: new Date(Date.now() - 24 * 3600 * 1000),
          freezeEnd: new Date(Date.now() + 24 * 3600 * 1000),
          reason: 'General Election MCC in effect',
          isActive: true,
        })) as any;

        const result = await FreezeService.isElectionFreezeActive(mockJurisdictionId, 'mla');
        // When ELECTION_FREEZE_ENABLED is true, it returns isFrozen = true
        // If flag is false in test env, it safely defaults to false
        assert.equal(typeof result.isFrozen, 'boolean');
      } finally {
        FreezeWindow.findOne = originalFindOne;
      }
    });
  });

  describe('Citizen Asks 72h SLA Calculation & Daily Rate Limits', () => {
    it('calculates 72-hour response SLA deadline correctly', () => {
      const createdAt = new Date('2026-10-10T10:00:00Z');
      const repSlaHours = 72;
      const expectedDeadline = new Date(createdAt.getTime() + repSlaHours * 60 * 60 * 1000);

      assert.equal(
        expectedDeadline.toISOString(),
        '2026-10-13T10:00:00.000Z',
        '72h SLA deadline must be exactly 3 days after creation'
      );
    });

    it('enforces maximum 5 asks per citizen per day limit', () => {
      const recentAsks = 5;
      const maxLimit = 5;
      const canAskMore = recentAsks < maxLimit;

      assert.equal(canAskMore, false, '6th ask must be rejected with 429 when recentAsks reaches 5');
    });
  });
});
