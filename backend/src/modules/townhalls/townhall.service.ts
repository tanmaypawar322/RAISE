import mongoose from 'mongoose';
import { TownhallTopic, ITownhallTopic, TownhallType, TownhallAuthorType } from '../../models/TownhallTopic.js';
import { TownhallFeedback, ITownhallFeedback, TownhallFeedbackType } from '../../models/TownhallFeedback.js';
import { AuditService } from '../../services/audit.service.js';

export interface CreateTownhallTopicInput {
  title: string;
  type: TownhallType;
  authorType: TownhallAuthorType;
  authorId: string;
  officeId?: string;
  jurisdictionId?: string;
  settlementType: 'rural_panchayat' | 'urban_municipal';
  villageOrWard: string;
  summary: string;
  clauses?: Array<{ clauseId: string; title: string; text: string }>;
}

export class TownhallService {
  /**
   * Publishes a new Townhall or Digital Gram Sabha deliberation topic.
   */
  static async createTopic(input: CreateTownhallTopicInput): Promise<ITownhallTopic> {
    const clausesWithVotes = (input.clauses || []).map((c, idx) => ({
      clauseId: c.clauseId || `clause-${idx + 1}`,
      title: c.title,
      text: c.text,
      voteUp: 0,
      voteDown: 0,
    }));

    const topic = new TownhallTopic({
      title: input.title,
      type: input.type,
      authorType: input.authorType,
      authorId: new mongoose.Types.ObjectId(input.authorId),
      officeId: input.officeId ? new mongoose.Types.ObjectId(input.officeId) : undefined,
      jurisdictionId: input.jurisdictionId ? new mongoose.Types.ObjectId(input.jurisdictionId) : undefined,
      settlementType: input.settlementType,
      villageOrWard: input.villageOrWard,
      summary: input.summary,
      clauses: clausesWithVotes,
      status: 'active',
    });

    await topic.save();

    await AuditService.log({
      action: 'townhall_topic_created',
      targetType: 'townhall',
      targetId: topic._id.toString(),
      actorId: input.authorId,
      details: {
        title: topic.title,
        type: topic.type,
        settlementType: topic.settlementType,
        clauseCount: topic.clauses.length,
        actorOfficeId: input.officeId,
      },
    });

    return topic;
  }

  /**
   * Lists topics with filtering and pagination.
   */
  static async getTopics(filters: {
    type?: string;
    settlementType?: string;
    villageOrWard?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }) {
    const query: any = {};
    if (filters.type) query.type = filters.type;
    if (filters.settlementType) query.settlementType = filters.settlementType;
    if (filters.villageOrWard) query.villageOrWard = filters.villageOrWard;
    if (filters.status) query.status = filters.status;
    else query.status = { $ne: 'archived' };

    const limit = Math.min(filters.limit || 20, 50);
    const skip = filters.skip || 0;

    const [topics, total] = await Promise.all([
      TownhallTopic.find(query)
        .populate('authorId', 'displayName name role')
        .populate('officeId', 'name level kind')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TownhallTopic.countDocuments(query),
    ]);

    return { topics, total, skip, limit };
  }

  /**
   * Retrieves a topic and its citizen feedback items.
   */
  static async getTopicById(id: string) {
    const topic = await TownhallTopic.findById(id)
      .populate('authorId', 'displayName name role')
      .populate('officeId', 'name level kind')
      .populate('officialResponse.respondedByOfficeId', 'name level')
      .populate('officialResponse.respondedByUserId', 'displayName');

    if (!topic) return null;

    const feedback = await TownhallFeedback.find({ topicId: topic._id })
      .populate('userId', 'displayName role')
      .sort({ upvotes: -1, createdAt: -1 });

    return { topic, feedback };
  }

  /**
   * Records a vote on a specific legislative/budget clause.
   */
  static async voteClause(topicId: string, clauseId: string, vote: 'up' | 'down') {
    const topic = await TownhallTopic.findById(topicId);
    if (!topic) throw new Error('Townhall topic not found');

    const clause = topic.clauses.find((c) => c.clauseId === clauseId);
    if (!clause) throw new Error('Clause not found in this topic');

    if (vote === 'up') {
      clause.voteUp += 1;
    } else {
      clause.voteDown += 1;
    }

    await topic.save();
    return { success: true, clause };
  }

  /**
   * Adds constructive structured citizen feedback.
   */
  static async addFeedback(
    topicId: string,
    userId: string,
    type: TownhallFeedbackType,
    content: string,
    clauseId?: string
  ): Promise<ITownhallFeedback> {
    const topic = await TownhallTopic.findById(topicId);
    if (!topic) throw new Error('Townhall topic not found');

    const feedback = new TownhallFeedback({
      topicId: topic._id,
      clauseId,
      userId: new mongoose.Types.ObjectId(userId),
      type,
      content,
      upvotes: 0,
      upvotedUserIds: [],
      isPreModerated: true,
    });

    await feedback.save();

    await AuditService.log({
      action: 'townhall_feedback_posted',
      targetType: 'townhall',
      targetId: topicId,
      actorId: userId,
      details: {
        feedbackId: feedback._id.toString(),
        type,
        clauseId,
      },
    });

    return feedback;
  }

  /**
   * Upvotes constructive citizen feedback/amendment.
   */
  static async upvoteFeedback(feedbackId: string, userId: string) {
    const feedback = await TownhallFeedback.findById(feedbackId);
    if (!feedback) throw new Error('Feedback not found');

    const uid = new mongoose.Types.ObjectId(userId);
    const hasUpvoted = feedback.upvotedUserIds.some((id) => id.equals(uid));

    if (hasUpvoted) {
      feedback.upvotedUserIds = feedback.upvotedUserIds.filter((id) => !id.equals(uid));
      feedback.upvotes = Math.max(0, feedback.upvotes - 1);
    } else {
      feedback.upvotedUserIds.push(uid);
      feedback.upvotes += 1;
    }

    await feedback.save();
    return { success: true, upvotes: feedback.upvotes, hasUpvoted: !hasUpvoted };
  }

  /**
   * Records official department / Gram Panchayat response.
   */
  static async addOfficialResponse(
    topicId: string,
    officeId: string,
    userId: string,
    responseText: string
  ) {
    const topic = await TownhallTopic.findById(topicId);
    if (!topic) throw new Error('Townhall topic not found');

    topic.officialResponse = {
      text: responseText,
      respondedAt: new Date(),
      respondedByOfficeId: new mongoose.Types.ObjectId(officeId),
      respondedByUserId: new mongoose.Types.ObjectId(userId),
    };

    await topic.save();

    await AuditService.log({
      action: 'townhall_official_responded',
      targetType: 'townhall',
      targetId: topicId,
      actorId: userId,
      details: {
        actorOfficeId: officeId,
        responseTextPreview: responseText.slice(0, 100),
      },
    });

    return topic;
  }
}
