import { Request, Response } from 'express';
import { z } from 'zod';
import { MilestoneService } from './milestone.service.js';

const CreateMilestoneSchema = z.object({
  representativeId: z.string().min(1, 'Representative ID is required'),
  officeId: z.string().optional(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(3000),
  category: z.enum(['roads', 'water', 'sanitation', 'health', 'education', 'electricity', 'other']),
  jurisdictionId: z.string().optional(),
  constituencyName: z.string().min(2, 'Constituency / Gram Panchayat name is required'),
  budgetPaise: z.number().int().min(0).optional().default(0),
  sanctionOrderNumber: z.string().optional(),
  sanctionOrderDocUrl: z.string().optional(),
  completionDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid completion date is required' }),
  photos: z.array(z.string()).optional(),
});

const VoteMilestoneSchema = z.object({
  vote: z.enum(['verify', 'dispute']),
  disputeReason: z.string().max(500).optional(),
});

export class MilestoneController {
  static async createMilestone(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const parsed = CreateMilestoneSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const milestone = await MilestoneService.createMilestone({
        ...parsed.data,
        completionDate: new Date(parsed.data.completionDate),
        userId: req.user.userId,
      });

      res.status(201).json({ success: true, milestone });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to create milestone' });
    }
  }

  static async getMilestones(req: Request, res: Response): Promise<void> {
    try {
      const { repId } = req.params;
      const milestones = await MilestoneService.getMilestonesForRepresentative(repId);
      res.json({ success: true, milestones });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch milestones' });
    }
  }

  static async getMilestoneDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await MilestoneService.getMilestoneById(id);
      if (!result) {
        res.status(404).json({ success: false, message: 'Milestone not found' });
        return;
      }
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch milestone' });
    }
  }

  static async voteMilestone(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required to audit milestones' });
        return;
      }

      const { id } = req.params;
      const parsed = VoteMilestoneSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const result = await MilestoneService.voteOnMilestone(
        id,
        req.user.userId,
        parsed.data.vote,
        parsed.data.disputeReason
      );

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to record vote' });
    }
  }
}
