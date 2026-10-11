import mongoose from 'mongoose';
import { EscalationDirective, IEscalationDirective } from '../../models/EscalationDirective.js';
import { Issue } from '../../models/Issue.js';
import { Office } from '../../models/Office.js';
import { AuditService } from '../../services/audit.service.js';
import { NotificationService } from '../../services/notification.service.js';

export interface CreateDirectiveInput {
  issueId: string;
  issuerUserId: string;
  issuerRole: 'admin' | 'official';
  issuerOfficeId?: string;
  issuerTitle?: string;
  directiveText: string;
  deadlineHours: number;
  targetOfficeId: string;
  targetUserId?: string;
  reassignedAgencyId?: string;
}

export class DirectiveService {
  /**
   * Issues a binding administrative directive to expedite civic resolution.
   */
  static async createDirective(input: CreateDirectiveInput): Promise<IEscalationDirective> {
    const issue = await Issue.findById(input.issueId);
    if (!issue) {
      throw new Error('Civic grievance not found');
    }

    const targetOffice = await Office.findById(input.targetOfficeId);
    if (!targetOffice) {
      throw new Error('Target administrative office not found');
    }

    const now = new Date();
    const deadlineAt = new Date(now.getTime() + input.deadlineHours * 3600 * 1000);

    const directive = new EscalationDirective({
      issueId: new mongoose.Types.ObjectId(input.issueId),
      issuerUserId: new mongoose.Types.ObjectId(input.issuerUserId),
      issuerRole: input.issuerRole,
      issuerOfficeId: input.issuerOfficeId ? new mongoose.Types.ObjectId(input.issuerOfficeId) : undefined,
      issuerTitle: input.issuerTitle,
      directiveText: input.directiveText,
      deadlineHours: input.deadlineHours,
      deadlineAt,
      targetOfficeId: new mongoose.Types.ObjectId(input.targetOfficeId),
      targetUserId: input.targetUserId ? new mongoose.Types.ObjectId(input.targetUserId) : undefined,
      reassignedAgencyId: input.reassignedAgencyId ? new mongoose.Types.ObjectId(input.reassignedAgencyId) : undefined,
      status: 'active',
    });

    await directive.save();

    // Bind active directive to issue and update timeline
    issue.activeDirectiveId = directive._id as mongoose.Types.ObjectId;
    issue.slaDeadline = deadlineAt;
    issue.slaHours = input.deadlineHours;

    const issuerLabel = input.issuerTitle || (input.issuerRole === 'admin' ? 'District Executive / Admin' : 'Supervisory Authority');
    issue.statusTimeline.push({
      status: issue.status,
      note: `Binding Directive issued by ${issuerLabel}: "${input.directiveText}" (Statutory Deadline: ${input.deadlineHours}h).`,
      updatedAt: now,
    });

    await issue.save();

    await AuditService.log({
      action: 'escalation_directive_issued',
      targetType: 'issue',
      targetId: input.issueId,
      actorId: input.issuerUserId,
      details: {
        directiveId: directive._id.toString(),
        deadlineHours: input.deadlineHours,
        deadlineAt,
        targetOfficeId: input.targetOfficeId,
        issuerTitle: input.issuerTitle,
        issuerOfficeId: input.issuerOfficeId,
      },
    });

    NotificationService.notifyOfficeMembers(
      new mongoose.Types.ObjectId(input.targetOfficeId),
      'office_escalation_received',
      {
        issueTitle: issue.title,
        hours: input.deadlineHours,
      },
      { directiveId: directive._id, issueId: issue._id }
    ).catch((err) => console.warn('[DirectiveService] Failed to notify target office:', err.message));

    return directive;
  }

  /**
   * Retrieves directives targeted to or issued by an office.
   */
  static async getDirectivesForOffice(officeId: string, status?: string) {
    const query: any = {
      $or: [
        { targetOfficeId: new mongoose.Types.ObjectId(officeId) },
        { issuerOfficeId: new mongoose.Types.ObjectId(officeId) },
      ],
    };
    if (status) {
      query.status = status;
    }
    return EscalationDirective.find(query)
      .populate('issueId', 'title category status escalationTier location')
      .populate('targetOfficeId', 'name level kind')
      .populate('issuerOfficeId', 'name level kind')
      .sort({ createdAt: -1 });
  }

  /**
   * Retrieves active directive for an issue.
   */
  static async getDirectiveForIssue(issueId: string) {
    return EscalationDirective.findOne({
      issueId: new mongoose.Types.ObjectId(issueId),
      status: 'active',
    })
      .populate('targetOfficeId', 'name level kind')
      .populate('issuerOfficeId', 'name level kind')
      .populate('issuerUserId', 'name');
  }

  /**
   * Submits proof of compliance for a directive.
   */
  static async complyDirective(
    directiveId: string,
    userId: string,
    complianceProof: { note?: string; photoUrls?: string[] }
  ): Promise<IEscalationDirective> {
    const directive = await EscalationDirective.findById(directiveId);
    if (!directive) {
      throw new Error('Directive not found');
    }
    if (directive.status !== 'active') {
      throw new Error(`Directive is already marked as ${directive.status}`);
    }

    const now = new Date();
    directive.status = 'complied';
    directive.compliedAt = now;
    directive.complianceProof = {
      note: complianceProof.note || 'Action completed per directive.',
      photoUrls: complianceProof.photoUrls || [],
      verifiedAt: now,
    };

    await directive.save();

    const issue = await Issue.findById(directive.issueId);
    if (issue) {
      issue.statusTimeline.push({
        status: issue.status,
        note: `Directive compliance verified: ${directive.complianceProof.note}`,
        updatedAt: now,
      });
      await issue.save();
    }

    await AuditService.log({
      action: 'escalation_directive_complied',
      targetType: 'issue',
      targetId: directive.issueId.toString(),
      actorId: userId,
      details: {
        directiveId: directive._id.toString(),
        complianceNote: directive.complianceProof.note,
        photoCount: directive.complianceProof.photoUrls?.length || 0,
      },
    });

    return directive;
  }

  /**
   * Periodically checks active directives and marks overdue directives as breached.
   */
  static async checkBreachedDirectives(): Promise<number> {
    const now = new Date();
    const breached = await EscalationDirective.find({
      status: 'active',
      deadlineAt: { $lt: now },
    });

    for (const directive of breached) {
      directive.status = 'breached';
      await directive.save();

      const issue = await Issue.findById(directive.issueId);
      if (issue) {
        issue.statusTimeline.push({
          status: issue.status,
          note: `STATUTORY BREACH: Senior Directive deadline (${directive.deadlineHours}h) expired without compliance.`,
          updatedAt: now,
        });
        await issue.save();
      }

      await AuditService.log({
        action: 'escalation_directive_breached',
        targetType: 'issue',
        targetId: directive.issueId.toString(),
        details: {
          directiveId: directive._id.toString(),
          targetOfficeId: directive.targetOfficeId.toString(),
          deadlineAt: directive.deadlineAt,
        },
      });
    }

    return breached.length;
  }
}
