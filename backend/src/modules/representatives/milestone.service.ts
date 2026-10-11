import mongoose from 'mongoose';
import { RepresentativeMilestone, IRepresentativeMilestone, MilestoneCategory } from '../../models/RepresentativeMilestone.js';
import { MilestoneVote } from '../../models/MilestoneVote.js';
import { RepresentativeProfile } from '../../models/RepresentativeProfile.js';
import { AuditService } from '../../services/audit.service.js';

export interface CreateMilestoneInput {
  representativeId: string;
  officeId?: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  jurisdictionId?: string;
  constituencyName: string;
  budgetPaise?: number;
  sanctionOrderNumber?: string;
  sanctionOrderDocUrl?: string;
  completionDate: Date;
  photos?: string[];
  userId: string;
}

const PROHIBITED_CAMPAIGN_TERMS = [
  'vote for',
  'chunav',
  'matdan',
  'prachar',
  'candidate',
  'election',
  'party',
  'rally',
  'slogan',
  'bjp',
  'congress',
  'inc',
  'aap',
  'shiv sena',
  'ncp',
  'manifesto',
];

export class MilestoneService {
  /**
   * Screens content for prohibited electoral campaigning slogans and party symbols.
   */
  static screenForCampaigning(text: string): { allowed: boolean; violation?: string } {
    const lower = text.toLowerCase();
    for (const term of PROHIBITED_CAMPAIGN_TERMS) {
      if (lower.includes(term)) {
        return {
          allowed: false,
          violation: `Self-reported milestone may not include electoral slogans or party affiliations ("${term}").`,
        };
      }
    }
    return { allowed: true };
  }

  /**
   * Publishes a verifiable milestone / public work.
   */
  static async createMilestone(input: CreateMilestoneInput): Promise<IRepresentativeMilestone> {
    const rep = await RepresentativeProfile.findById(input.representativeId);
    if (!rep) {
      throw new Error('Representative profile not found');
    }

    // Campaigning check
    const screenTitle = this.screenForCampaigning(input.title);
    if (!screenTitle.allowed) throw new Error(screenTitle.violation);

    const screenDesc = this.screenForCampaigning(input.description);
    if (!screenDesc.allowed) throw new Error(screenDesc.violation);

    const now = new Date();
    // 14-day statutory voter confirmation window
    const verificationWindowEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const milestone = new RepresentativeMilestone({
      representativeId: new mongoose.Types.ObjectId(input.representativeId),
      officeId: input.officeId ? new mongoose.Types.ObjectId(input.officeId) : rep.officeId,
      title: input.title,
      description: input.description,
      category: input.category,
      jurisdictionId: input.jurisdictionId ? new mongoose.Types.ObjectId(input.jurisdictionId) : rep.jurisdictionId,
      constituencyName: input.constituencyName,
      budgetPaise: input.budgetPaise || 0,
      sanctionOrderNumber: input.sanctionOrderNumber,
      sanctionOrderDocUrl: input.sanctionOrderDocUrl,
      completionDate: input.completionDate,
      photos: input.photos || [],
      verificationWindowEnd,
      verifiedCount: 0,
      disputedCount: 0,
      status: 'active',
      isPreModerated: true,
    });

    await milestone.save();

    await AuditService.log({
      action: 'representative_milestone_created',
      targetType: 'representative',
      targetId: input.representativeId,
      actorId: input.userId,
      details: {
        milestoneId: milestone._id.toString(),
        title: milestone.title,
        budgetPaise: milestone.budgetPaise,
        constituencyName: milestone.constituencyName,
        verificationWindowEnd,
      },
    });

    return milestone;
  }

  /**
   * Retrieves all milestones for a representative profile.
   */
  static async getMilestonesForRepresentative(representativeId: string) {
    return RepresentativeMilestone.find({
      representativeId: new mongoose.Types.ObjectId(representativeId),
    }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a single milestone by ID with recent citizen audit feedback.
   */
  static async getMilestoneById(milestoneId: string) {
    const milestone = await RepresentativeMilestone.findById(milestoneId)
      .populate('representativeId', 'displayName role titleText officeId')
      .populate('officeId', 'name level kind');

    if (!milestone) return null;

    const recentVotes = await MilestoneVote.find({
      milestoneId: milestone._id,
    })
      .select('vote disputeReason verifiedResident createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    return {
      milestone,
      recentVotes,
    };
  }

  /**
   * Records a local citizen's verification or dispute on a representative's milestone.
   */
  static async voteOnMilestone(
    milestoneId: string,
    userId: string,
    vote: 'verify' | 'dispute',
    disputeReason?: string
  ) {
    const milestone = await RepresentativeMilestone.findById(milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    const now = new Date();
    if (now > milestone.verificationWindowEnd && milestone.status !== 'active') {
      throw new Error('The 14-day community verification window for this milestone has concluded.');
    }

    if (vote === 'dispute' && (!disputeReason || disputeReason.trim().length < 5)) {
      throw new Error('A valid reason must be provided when disputing a public milestone.');
    }

    // Upsert vote
    const existingVote = await MilestoneVote.findOne({
      milestoneId: milestone._id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (existingVote) {
      existingVote.vote = vote;
      existingVote.disputeReason = disputeReason;
      await existingVote.save();
    } else {
      await MilestoneVote.create({
        milestoneId: milestone._id,
        userId: new mongoose.Types.ObjectId(userId),
        vote,
        disputeReason,
        verifiedResident: true,
      });
    }

    // Recompute counts
    const [verifiedCount, disputedCount] = await Promise.all([
      MilestoneVote.countDocuments({ milestoneId: milestone._id, vote: 'verify' }),
      MilestoneVote.countDocuments({ milestoneId: milestone._id, vote: 'dispute' }),
    ]);

    milestone.verifiedCount = verifiedCount;
    milestone.disputedCount = disputedCount;

    const totalVotes = verifiedCount + disputedCount;
    if (totalVotes >= 5) {
      const confirmationRatio = verifiedCount / totalVotes;
      if (confirmationRatio >= 0.7) {
        milestone.status = 'verified';
      } else if (disputedCount / totalVotes > 0.4) {
        milestone.status = 'disputed';
      }
    }

    await milestone.save();

    await AuditService.log({
      action: 'milestone_citizen_vote',
      targetType: 'milestone',
      targetId: milestone._id.toString(),
      actorId: userId,
      details: {
        vote,
        verifiedCount,
        disputedCount,
        status: milestone.status,
      },
    });

    return {
      success: true,
      milestone,
    };
  }
}
