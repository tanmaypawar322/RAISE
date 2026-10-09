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
    const maxEscalationLevel = 3;

    // Find active grievances that are not resolved/rejected and haven't hit maximum escalation tier
    const candidates = await Issue.find({
      status: { $in: ['submitted', 'acknowledged', 'under_review', 'published', 'in_progress'] },
      escalationLevel: { $lt: maxEscalationLevel },
    });

    const escalatedIssues: EscalationRunResult['escalatedIssues'] = [];

    for (const issue of candidates) {
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

      // Check if SLA has breached
      if (now > deadline) {
        const currentOfficeId = issue.officeId;
        const currentOffice = await Office.findById(currentOfficeId);

        let targetOfficeId: mongoose.Types.ObjectId | null = null;

        // 1. Check office's configured escalation target
        if (currentOffice?.escalatesToOfficeId) {
          targetOfficeId = currentOffice.escalatesToOfficeId as mongoose.Types.ObjectId;
        } else if (currentOffice?.parentOfficeId) {
          targetOfficeId = currentOffice.parentOfficeId as mongoose.Types.ObjectId;
        } else if (currentOffice?.jurisdictionId) {
          // 2. Fallback: Find office in parent jurisdiction
          const currentJurisdiction = await Jurisdiction.findById(currentOffice.jurisdictionId);
          if (currentJurisdiction?.parentJurisdictionId) {
            const parentOffice = await Office.findOne({
              jurisdictionId: currentJurisdiction.parentJurisdictionId,
              $or: [
                { supportedCategories: issue.category },
                { department: issue.category },
                { department: 'general' },
              ],
            });
            if (parentOffice) {
              targetOfficeId = parentOffice._id as mongoose.Types.ObjectId;
            }
          }
        }

        // 3. Fallback: Central Headquarters Office
        if (!targetOfficeId) {
          const hqOffice =
            (await Office.findOne({
              $or: [{ level: 'corporation' }, { department: 'general' }],
            })) || (await Office.findOne({ _id: { $ne: currentOfficeId } }));
          if (hqOffice) {
            targetOfficeId = hqOffice._id as mongoose.Types.ObjectId;
          } else {
            // Keep at current office if no other office exists
            targetOfficeId = currentOfficeId;
          }
        }

        // Advance level and record escalation event
        const newLevel = (issue.escalationLevel || 0) + 1;
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

        issue.escalationHistory.push({
          fromOfficeId: currentOfficeId,
          toOfficeId: targetOfficeId,
          escalatedAt: now,
          reason: 'sla_breach',
        });

        issue.statusTimeline.push({
          status: issue.status,
          note: `Automatically escalated to ${targetOffice?.name || 'Supervisory Authority'} due to SLA breach (Escalation Tier ${newLevel}/3).`,
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

  static stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
