import { Request, Response } from 'express';
import { z } from 'zod';
import { TownhallService } from './townhall.service.js';

const CreateTopicSchema = z.object({
  title: z.string().min(5).max(250),
  type: z.enum(['government_policy', 'ward_budget', 'gram_sabha_agenda', 'community_topic']),
  settlementType: z.enum(['rural_panchayat', 'urban_municipal']).default('rural_panchayat'),
  villageOrWard: z.string().min(2).max(100),
  summary: z.string().min(20).max(4000),
  officeId: z.string().optional(),
  jurisdictionId: z.string().optional(),
  clauses: z
    .array(
      z.object({
        clauseId: z.string().optional().default(''),
        title: z.string().min(2).max(150),
        text: z.string().min(5).max(2000),
      })
    )
    .optional(),
});

const AddFeedbackSchema = z.object({
  type: z.enum(['support', 'concern', 'amendment']),
  content: z.string().min(10).max(1000),
  clauseId: z.string().optional(),
});

const VoteClauseSchema = z.object({
  vote: z.enum(['up', 'down']),
});

const OfficialResponseSchema = z.object({
  responseText: z.string().min(10).max(3000),
  officeId: z.string().optional(),
});

export class TownhallController {
  static async createTopic(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const parsed = CreateTopicSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      let authorType: 'official' | 'representative' | 'citizen' = 'citizen';
      if (req.user.role === 'admin' || req.user.role === 'official') {
        authorType = 'official';
      }

      const topic = await TownhallService.createTopic({
        ...parsed.data,
        authorType,
        authorId: req.user.userId,
        officeId: parsed.data.officeId || req.user.officialOfficeId,
      });

      res.status(201).json({ success: true, topic });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to create townhall topic' });
    }
  }

  static async getTopics(req: Request, res: Response): Promise<void> {
    try {
      const { type, settlementType, villageOrWard, status, limit, skip } = req.query;
      const result = await TownhallService.getTopics({
        type: typeof type === 'string' ? type : undefined,
        settlementType: typeof settlementType === 'string' ? settlementType : undefined,
        villageOrWard: typeof villageOrWard === 'string' ? villageOrWard : undefined,
        status: typeof status === 'string' ? status : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch topics' });
    }
  }

  static async getTopicById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TownhallService.getTopicById(id);
      if (!result) {
        res.status(404).json({ success: false, message: 'Townhall topic not found' });
        return;
      }
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch topic' });
    }
  }

  static async voteClause(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id, clauseId } = req.params;
      const parsed = VoteClauseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const result = await TownhallService.voteClause(id, clauseId, parsed.data.vote);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to vote on clause' });
    }
  }

  static async addFeedback(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const parsed = AddFeedbackSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const feedback = await TownhallService.addFeedback(
        id,
        req.user.userId,
        parsed.data.type,
        parsed.data.content,
        parsed.data.clauseId
      );

      res.status(201).json({ success: true, feedback });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to submit feedback' });
    }
  }

  static async upvoteFeedback(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const result = await TownhallService.upvoteFeedback(id, req.user.userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to upvote feedback' });
    }
  }

  static async addOfficialResponse(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'official')) {
        res.status(403).json({ success: false, message: 'Only government officials or admins may post official responses' });
        return;
      }

      const { id } = req.params;
      const parsed = OfficialResponseSchema.parse(req.body);
      const officeId = parsed.officeId || req.user.officialOfficeId;

      if (!officeId) {
        res.status(400).json({ success: false, message: 'Official office binding required' });
        return;
      }

      const topic = await TownhallService.addOfficialResponse(
        id,
        officeId,
        req.user.userId,
        parsed.responseText
      );

      res.json({ success: true, topic });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to add official response' });
    }
  }
}
