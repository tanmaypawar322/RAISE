import { Router } from 'express';
import { DirectiveController } from './directive.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// Create binding directive (admin or official)
router.post('/', requireAuth, requireRole(['admin', 'official']), DirectiveController.createDirective);

// Get directives for an office
router.get('/office/:officeId', requireAuth, DirectiveController.getDirectivesForOffice);

// Get active directive for an issue
router.get('/issue/:issueId', DirectiveController.getDirectiveForIssue);

// Comply with a directive
router.post('/:id/comply', requireAuth, requireRole(['admin', 'official']), DirectiveController.complyDirective);

export default router;
