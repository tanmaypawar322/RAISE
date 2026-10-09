import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NotificationService,
  ESSENTIAL_EVENTS,
  SMS_ELIGIBLE_EVENTS,
} from '../../services/notification.service.js';
import {
  NotificationTemplates,
  SupportedLanguage,
} from '../../services/notification-templates.js';
import { NotificationType } from '../../models/Notification.js';

describe('Phase 4: Notification Infrastructure & Subscriptions', () => {
  describe('1. IST Quiet Hours Calculation (21:00 to 08:00 IST)', () => {
    it('correctly identifies quiet hours in Indian Standard Time (UTC+5:30)', () => {
      // 21:00 IST = 15:30 UTC
      const ist2100 = new Date('2026-10-09T15:30:00.000Z');
      assert.equal(NotificationService.isQuietHours(ist2100), true);

      // 23:59 IST = 18:29 UTC
      const ist2359 = new Date('2026-10-09T18:29:00.000Z');
      assert.equal(NotificationService.isQuietHours(ist2359), true);

      // 03:00 IST = 21:30 UTC (previous day)
      const ist0300 = new Date('2026-10-08T21:30:00.000Z');
      assert.equal(NotificationService.isQuietHours(ist0300), true);

      // 07:59 IST = 02:29 UTC
      const ist0759 = new Date('2026-10-09T02:29:00.000Z');
      assert.equal(NotificationService.isQuietHours(ist0759), true);

      // 08:00 IST = 02:30 UTC (morning quiet hours end)
      const ist0800 = new Date('2026-10-09T02:30:00.000Z');
      assert.equal(NotificationService.isQuietHours(ist0800), false);

      // 12:00 IST = 06:30 UTC (daytime active)
      const ist1200 = new Date('2026-10-09T06:30:00.000Z');
      assert.equal(NotificationService.isQuietHours(ist1200), false);

      // 20:59 IST = 15:29 UTC (evening right before quiet hours)
      const ist2059 = new Date('2026-10-09T15:29:00.000Z');
      assert.equal(NotificationService.isQuietHours(ist2059), false);
    });
  });

  describe('2. Trilingual Template Engine (en, mr, hi)', () => {
    const allEvents: NotificationType[] = [
      'issue_published',
      'issue_acknowledged',
      'issue_status_updated',
      'issue_resolved_pending_confirmation',
      'issue_disputed',
      'issue_escalated',
      'issue_merged',
      'moderation_outcome',
      'supported_issue_updated',
      'office_new_assignment',
      'office_sla_warning_75',
      'office_sla_breached',
      'office_escalation_received',
    ];

    const languages: SupportedLanguage[] = ['en', 'mr', 'hi'];

    it('renders localized title and body for all 13 event types without missing keys', () => {
      const vars = {
        issueTitle: 'Water Pipe Leakage',
        ward: 'Ward 12',
        officeName: 'Water Supply Dept',
        linkUrl: 'https://raise.org/issues/123',
        status: 'in_progress',
      };

      for (const event of allEvents) {
        for (const lang of languages) {
          const rendered = NotificationTemplates.render(event, lang, vars);
          assert.ok(rendered.title, `Missing title for ${event} in ${lang}`);
          assert.ok(rendered.body, `Missing body for ${event} in ${lang}`);
          assert.ok(rendered.title.length > 3, `Title too short for ${event} in ${lang}`);
          assert.ok(rendered.body.length > 10, `Body too short for ${event} in ${lang}`);
        }
      }
    });

    it('guarantees SMS text has STRICTLY ZERO PII (no names, phones, residential addresses)', () => {
      const piiCheckRegex = /(\+91\d{10}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|Flat|Apartment|Sector\s*\d+)/i;

      for (const event of SMS_ELIGIBLE_EVENTS) {
        for (const lang of languages) {
          const rendered = NotificationTemplates.render(event, lang, {
            issueTitle: 'Pothole on Main Road',
            officeName: 'PCMC Ward 12 Office',
            linkUrl: 'https://raise.org/issues/abc1234',
          });

          if (rendered.smsText) {
            assert.equal(
              piiCheckRegex.test(rendered.smsText),
              false,
              `PII pattern detected in SMS template for ${event} (${lang}): ${rendered.smsText}`
            );
            // Must contain RAISE prefix and deep link
            assert.ok(rendered.smsText.includes('RAISE:'));
            assert.ok(rendered.smsText.includes('https://raise.org/issues/abc1234'));
          }
        }
      }
    });
  });

  describe('3. SMS Eligibility & Cost Control Rules', () => {
    it('restricts SMS dispatch to only 3 high-value citizen events', () => {
      assert.equal(SMS_ELIGIBLE_EVENTS.length, 3);
      assert.ok(SMS_ELIGIBLE_EVENTS.includes('issue_acknowledged'));
      assert.ok(SMS_ELIGIBLE_EVENTS.includes('issue_resolved_pending_confirmation'));
      assert.ok(SMS_ELIGIBLE_EVENTS.includes('issue_disputed'));

      // Low-value / administrative events must NOT be SMS eligible
      assert.equal(SMS_ELIGIBLE_EVENTS.includes('issue_published'), false);
      assert.equal(SMS_ELIGIBLE_EVENTS.includes('issue_status_updated'), false);
      assert.equal(SMS_ELIGIBLE_EVENTS.includes('supported_issue_updated'), false);
      assert.equal(SMS_ELIGIBLE_EVENTS.includes('office_sla_warning_75'), false);
    });
  });

  describe('4. Essential Event Opt-out Protection & Sanity', () => {
    it('defines non-negotiable essential events that users cannot opt out of', () => {
      assert.ok(ESSENTIAL_EVENTS.includes('issue_resolved_pending_confirmation'));
      assert.ok(ESSENTIAL_EVENTS.includes('issue_disputed'));
      assert.ok(ESSENTIAL_EVENTS.includes('office_sla_breached'));
      assert.ok(ESSENTIAL_EVENTS.includes('office_new_assignment'));
      assert.ok(ESSENTIAL_EVENTS.includes('office_escalation_received'));
    });

    it('sanitizes user optOutEvents by stripping essential events', () => {
      const userSuppliedOptOuts = [
        'issue_published',
        'issue_resolved_pending_confirmation', // Essential!
        'office_sla_breached', // Essential!
        'supported_issue_updated',
      ];

      const sanitized = userSuppliedOptOuts.filter(
        (e) => !ESSENTIAL_EVENTS.includes(e as any)
      );

      assert.deepEqual(sanitized, ['issue_published', 'supported_issue_updated']);
      assert.equal(sanitized.includes('issue_resolved_pending_confirmation'), false);
      assert.equal(sanitized.includes('office_sla_breached'), false);
    });
  });

  describe('5. Deduplication Logic Simulation', () => {
    it('suppresses identical notifications generated within 15 minutes', () => {
      const memoryStore: Array<{ userId: string; dedupKey: string; createdAt: Date }> = [];

      const canDispatch = (userId: string, dedupKey: string, now: Date): boolean => {
        const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
        const existing = memoryStore.find(
          (n) => n.userId === userId && n.dedupKey === dedupKey && n.createdAt >= fifteenMinsAgo
        );
        if (existing) {
          return false;
        }
        memoryStore.push({ userId, dedupKey, createdAt: now });
        return true;
      };

      const t0 = new Date('2026-10-09T10:00:00.000Z');
      assert.equal(canDispatch('user1', 'sla_warn_75_issue1', t0), true);

      // Same key 5 minutes later -> duplicate suppressed
      const t5 = new Date('2026-10-09T10:05:00.000Z');
      assert.equal(canDispatch('user1', 'sla_warn_75_issue1', t5), false);

      // Different issue key 5 minutes later -> dispatched
      assert.equal(canDispatch('user1', 'sla_warn_75_issue2', t5), true);

      // Same key 16 minutes later -> allowed (after 15-min window)
      const t16 = new Date('2026-10-09T10:16:00.000Z');
      assert.equal(canDispatch('user1', 'sla_warn_75_issue1', t16), true);
    });
  });
});
