import mongoose from 'mongoose';
import { Issue, IIssue } from '../models/Issue.js';
import { Office, IOffice } from '../models/Office.js';
import { Jurisdiction } from '../models/Jurisdiction.js';
import { AuditService } from './audit.service.js';
import { NotificationService } from './notification.service.js';
import { config } from '../config/env.js';

export interface EscalationRunResult {
  checkedCount: number;
  escalatedCount: number;
  escalatedIssues: Array<{
    issueId: string;
    title: string;
    fromOfficeId: string;
    toOfficeId: string;
    newLevel: number;
    escalatedAt: Date;
  }>;
  autoClosedCount?: number;
}

export class EscalationService {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Calculates the SLA deadline Date based on hours/minutes scale.
   */
  static calculateSlaDeadline(createdAt: Date, slaHours: number): Date {
    const scale = config.slaScale || 'hours';
    const multiplier = scale === 'minutes' ? 60 * 1000 : 3600 * 1000;
    return new Date(createdAt.getTime() + slaHours * multiplier);
  }

  /**
   * Scans for SLA-breached civic grievances and escalates them up the administrative hierarchy.
   */
  static async runEscalationCheck(): Promise<EscalationRunResult> {
    const now = new Date();
    const maxEscalationLevel = 5;

    // Find active grievances that are not resolved/rejected and haven't hit maximum escalation tier (5)
    const candidates = await Issue.find({
      status: { $in: ['submitted', 'acknowledged', 'under_review', 'published', 'in_progress'] },
      escalationTier: { $lt: maxEscalationLevel },
    });

    const escalatedIssues: EscalationRunResult['escalatedIssues'] = [];

    for (const issue of candidates) {
      // 1. Check & update population-adaptive community verification
      await this.checkCommunityVerification(issue);

      // Determine SLA deadline
      let deadline = issue.slaDeadline;
      if (!deadline) {
        const slaHours = issue.slaHours || 48;
        deadline = this.calculateSlaDeadline(issue.createdAt, slaHours);
        issue.slaDeadline = deadline;
      }

      // Check 75% SLA warning for active issues
      const totalSlaMs = deadline.getTime() - issue.createdAt.getTime();
      const elapsedMs = now.getTime() - issue.createdAt.getTime();
      if (now <= deadline && elapsedMs >= 0.75 * totalSlaMs) {
        NotificationService.notifyOfficeMembers(
          issue.officeId,
          'office_sla_warning_75',
          { issueTitle: issue.title },
          { issueId: issue._id },
          `sla_warn_75_${issue._id}`
        ).catch((err) => console.warn('[Escalation] Failed to notify 75% SLA warning:', err.message));
      }

      const isSlaBreached = now > deadline;
      const { targetTier, trigger } = this.getRequiredTier(issue, isSlaBreached);

      // If an escalation trigger is active and advances the tier
      if (trigger !== 'none' && targetTier > (issue.escalationTier || issue.escalationLevel || 1)) {
        const currentOfficeId = issue.officeId;
        const currentOffice = await Office.findById(currentOfficeId);
        const isRural = issue.settlementType === 'rural_panchayat';

        let targetOfficeId: mongoose.Types.ObjectId | null = null;

        // Resolve target office by tier and track
        if (targetTier === 2) {
          // Taluka / Corporation level
          const nextOffice = await Office.findOne({
            $or: [
              { _id: currentOffice?.escalatesToOfficeId },
              { _id: currentOffice?.parentOfficeId },
              { level: isRural ? 'taluka' : 'corporation' },
              { department: issue.category },
            ],
            _id: { $ne: currentOfficeId },
          });
          targetOfficeId = (nextOffice?._id as mongoose.Types.ObjectId) || currentOfficeId;
        } else if (targetTier === 3) {
          // District level (District Collector / Zilla Parishad)
          const distOffice = await Office.findOne({
            level: 'district',
          });
          targetOfficeId = (distOffice?._id as mongoose.Types.ObjectId) || currentOffice?.escalatesToOfficeId as any || currentOfficeId;
        } else if (targetTier === 4) {
          // State level (State Ministry / CM Office)
          const stateOffice = await Office.findOne({
            $or: [{ level: 'state' }, { kind: 'ministry' }],
          });
          targetOfficeId = (stateOffice?._id as mongoose.Types.ObjectId) || currentOfficeId;
        } else if (targetTier >= 5) {
          // National level (PMO / Central Executive)
          const execOffice = await Office.findOne({
            kind: 'executive_office',
          });
          targetOfficeId = (execOffice?._id as mongoose.Types.ObjectId) || currentOfficeId;
        }

        if (!targetOfficeId) {
          targetOfficeId = currentOfficeId;
        }

        // Advance tier and record escalation event
        const newLevel = targetTier;
        issue.escalationTier = newLevel;
        issue.escalationLevel = newLevel;
        issue.escalatedAt = now;
        issue.officeId = targetOfficeId;

        // Update new deadline for next escalation level
        const targetOffice = await Office.findById(targetOfficeId);
        const nextSlaHours = targetOffice?.slaHours
          ? typeof targetOffice.slaHours === 'number'
          ? targetOffice.slaHours
          : (targetOffice.slaHours as any)[issue.category] || 48
          : 48;
        issue.slaHours = nextSlaHours;
        issue.slaDeadline = this.calculateSlaDeadline(now, nextSlaHours);

        const reasonText = trigger === 'raise_threshold'
          ? `citizen raise threshold (${issue.raiseCount} citizen backers)`
          : 'statutory SLA clock breach';

        issue.escalationHistory.push({
          fromOfficeId: currentOfficeId,
          toOfficeId: targetOfficeId,
          escalatedAt: now,
          reason: trigger === 'raise_threshold' ? 'raise_threshold' : 'sla_breach',
        });

        issue.statusTimeline.push({
          status: issue.status,
          note: `Escalated to Tier ${newLevel}/5 (${targetOffice?.name || 'Supervisory Authority'}) due to ${reasonText}.`,
          updatedAt: now,
        });

        await issue.save();

        await AuditService.log({
          action: 'issue_escalated',
          targetType: 'issue',
          targetId: issue._id.toString(),
          details: {
            issueId: issue._id.toString(),
            fromOfficeId: currentOfficeId.toString(),
            toOfficeId: targetOfficeId.toString(),
            level: newLevel,
            category: issue.category,
          },
        });

        // Trigger escalation notifications:
        // 1. Notify breached subordinate office
        NotificationService.notifyOfficeMembers(
          currentOfficeId,
          'office_sla_breached',
          { issueTitle: issue.title },
          { issueId: issue._id },
          `office_sla_breached_${issue._id}`
        ).catch((err) => console.warn('[Escalation] Failed to notify breached office:', err.message));

        // 2. Notify receiving supervisory office
        if (targetOfficeId.toString() !== currentOfficeId.toString()) {
          NotificationService.notifyOfficeMembers(
            targetOfficeId,
            'office_escalation_received',
            { issueTitle: issue.title },
            { issueId: issue._id },
            `office_escalation_received_${issue._id}_${targetOfficeId}`
          ).catch((err) => console.warn('[Escalation] Failed to notify receiving office:', err.message));
        }

        // 3. Notify creator
        if (issue.authorId) {
          NotificationService.notifyUser({
            userId: issue.authorId,
            type: 'issue_escalated',
            vars: { issueTitle: issue.title, officeName: targetOffice?.name },
            data: { issueId: issue._id },
            dedupKey: `issue_escalated_${issue._id}_level_${newLevel}`,
          }).catch((err) => console.warn('[Escalation] Failed to notify creator:', err.message));
        }

        // 4. Notify supporters
        NotificationService.notifyIssueSupporters(
          issue._id,
          'issue_escalated',
          { issueTitle: issue.title, officeName: targetOffice?.name },
          { issueId: issue._id },
          issue.authorId
        ).catch((err) => console.warn('[Escalation] Failed to notify supporters:', err.message));

        escalatedIssues.push({
          issueId: issue._id.toString(),
          title: issue.title,
          fromOfficeId: currentOfficeId.toString(),
          toOfficeId: targetOfficeId.toString(),
          newLevel,
          escalatedAt: now,
        });
      }
    }


    // Also auto-finalize issues whose 7-day citizen confirmation window expired without disputes
    const autoClosedCount = await this.autoCloseExpiredConfirmations();

    return {
      checkedCount: candidates.length,
      escalatedCount: escalatedIssues.length,
      escalatedIssues,
      autoClosedCount,
    };
  }

  /**
   * Scans for issues in 'resolved_pending_confirmation' where the confirmation window (7 days)
   * has elapsed without citizen disputes.
   * - If confirmedByCount >= 1: closes as 'resolved' with 'resolved_confirmed'
   * - If confirmedByCount === 0: closes as 'resolved' with 'resolved_unconfirmed'
   */
  static async autoCloseExpiredConfirmations(): Promise<number> {
    const now = new Date();
    const expiredCandidates = await Issue.find({
      status: 'resolved_pending_confirmation',
      confirmationDeadline: { $lte: now },
      disputedByCount: 0,
    });

    let closedCount = 0;
    for (const issue of expiredCandidates) {
      const isConfirmed = (issue.confirmedByCount || 0) > 0;
      issue.status = 'resolved';
      issue.confirmationStatus = isConfirmed ? 'resolved_confirmed' : 'resolved_unconfirmed';
      issue.statusTimeline.push({
        status: 'resolved',
        note: isConfirmed
          ? `Automatically finalized after confirmation window: Resolved (confirmed by ${issue.confirmedByCount} citizen${issue.confirmedByCount > 1 ? 's' : ''}).`
          : 'Automatically finalized after confirmation window: Resolved (unconfirmed by citizens).',
        updatedAt: now,
      });

      await issue.save();
      closedCount++;

      await AuditService.log({
        action: 'issue_auto_finalized',
        targetType: 'issue',
        targetId: issue._id.toString(),
        details: {
          issueId: issue._id.toString(),
          confirmationStatus: issue.confirmationStatus,
          confirmedByCount: issue.confirmedByCount,
        },
      });
    }

    return closedCount;
  }

  /**
   * Initializes periodic scheduled escalation engine.
   */
  static startScheduler(intervalMs = 15 * 60 * 1000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(async () => {
      try {
        await this.runEscalationCheck();
      } catch (err) {
        console.error('[ESCALATION-SCHEDULER] Error during periodic escalation run:', err);
      }
    }, intervalMs);
    // Unref so timer doesn't prevent Node process termination during tests
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Evaluates population-adaptive community verification.
   * Rural Panchayats: 5 citizen raises activate statutory SLA clock.
   * Urban Municipalities: 25 citizen raises verify local consensus.
   */
  static async checkCommunityVerification(issue: IIssue): Promise<boolean> {
    if (issue.isCommunityVerified) {
      return true;
    }

    const isRural = issue.settlementType === 'rural_panchayat';
    const threshold = isRural ? 5 : 25;

    if ((issue.raiseCount || 0) >= threshold) {
      issue.isCommunityVerified = true;
      issue.communityVerifiedAt = new Date();
      issue.statusTimeline.push({
        status: issue.status,
        note: `Community-verified by local citizens (${issue.raiseCount || 0}/${threshold} raises). SLA clock activated.`,
        updatedAt: new Date(),
      });
      await issue.save();
      return true;
    }
    return false;
  }

  /**
   * Calculates required administrative tier (1-5) and trigger reason.
   */
  static getRequiredTier(
    issue: IIssue,
    isSlaBreached: boolean
  ): { targetTier: number; trigger: 'raise_threshold' | 'sla_breach' | 'none' } {
    const isRural = issue.settlementType === 'rural_panchayat';
    const currentTier = issue.escalationTier || issue.escalationLevel || 1;
    const count = issue.raiseCount || 0;

    // Check raise threshold qualifications first (highest tier wins)
    let raiseTargetTier = currentTier;
    if (isRural) {
      if (count >= 250) raiseTargetTier = 4;
      else if (count >= 50) raiseTargetTier = 3;
      else if (count >= 15) raiseTargetTier = 2;
    } else {
      if (count >= 2500) raiseTargetTier = 4;
      else if (count >= 500) raiseTargetTier = 3;
      else if (count >= 100) raiseTargetTier = 2;
    }

    // Check SLA breach progression
    const slaTargetTier = isSlaBreached && currentTier < 5 ? currentTier + 1 : currentTier;

    if (raiseTargetTier > currentTier && raiseTargetTier >= slaTargetTier) {
      return { targetTier: raiseTargetTier, trigger: 'raise_threshold' };
    } else if (slaTargetTier > currentTier) {
      return { targetTier: slaTargetTier, trigger: 'sla_breach' };
    }

    return { targetTier: currentTier, trigger: 'none' };
  }

  static stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
