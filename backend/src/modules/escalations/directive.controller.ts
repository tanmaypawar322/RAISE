import { Request, Response } from 'express';
import { z } from 'zod';
import { DirectiveService } from './directive.service.js';

const CreateDirectiveSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
  directiveText: z.string().min(10, 'Directive must be at least 10 characters').max(1000),
  deadlineHours: z.number().int().min(12).max(168).default(48),
  targetOfficeId: z.string().min(1, 'Target office ID is required'),
  targetUserId: z.string().optional(),
  reassignedAgencyId: z.string().optional(),
  issuerOfficeId: z.string().optional(),
  issuerTitle: z.string().max(120).optional(),
});

const ComplyDirectiveSchema = z.object({
  note: z.string().min(5).max(1000).optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export class DirectiveController {
  static async createDirective(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'official')) {
        res.status(403).json({ error: 'Only administrative officials and executives may issue directives' });
        return;
      }

      const parsed = CreateDirectiveSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const directive = await DirectiveService.createDirective({
        ...parsed.data,
        issuerUserId: req.user.userId,
        issuerRole: req.user.role as 'admin' | 'official',
        issuerOfficeId: parsed.data.issuerOfficeId || req.user.officialOfficeId,
      });

      res.status(201).json({ success: true, directive });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to issue directive' });
    }
  }

  static async getDirectivesForOffice(req: Request, res: Response): Promise<void> {
    try {
      const { officeId } = req.params;
      const { status } = req.query;

      const directives = await DirectiveService.getDirectivesForOffice(
        officeId,
        typeof status === 'string' ? status : undefined
      );

      res.json({ success: true, directives });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch office directives' });
    }
  }

  static async getDirectiveForIssue(req: Request, res: Response): Promise<void> {
    try {
      const { issueId } = req.params;
      const directive = await DirectiveService.getDirectiveForIssue(issueId);
      res.json({ success: true, directive });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch issue directive' });
    }
  }

  static async complyDirective(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'official')) {
        res.status(403).json({ error: 'Only administrative personnel may mark directives as complied' });
        return;
      }

      const { id } = req.params;
      const parsed = ComplyDirectiveSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const directive = await DirectiveService.complyDirective(
        id,
        req.user.userId,
        parsed.data
      );

      res.json({ success: true, directive });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to comply directive' });
    }
  }
}
