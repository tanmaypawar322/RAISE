import { Router } from 'express';
import { ModerationController } from './moderation.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// Citizen Report Flagging & Appeals
router.post('/report', requireAuth, ModerationController.submitReport);
router.post('/appeal', requireAuth, ModerationController.submitAppeal);
router.post('/public-report', ModerationController.submitPublicReport);
router.get('/transparency-log', ModerationController.getTransparencyLog);

// Moderator Queue
router.get('/queue', requireAuth, requireRole(['moderator', 'admin']), ModerationController.getQueue);
router.patch('/review/:id', requireAuth, requireRole(['moderator', 'admin']), ModerationController.reviewReport);

// Admin Governance & Escalation
router.get('/admin/stats', requireAuth, requireRole(['admin']), ModerationController.getAdminStats);
router.get('/admin/claims', requireAuth, requireRole(['admin']), ModerationController.getPendingClaims);
router.post('/admin/claims/:officeId', requireAuth, requireRole(['admin']), ModerationController.verifyClaim);
router.get('/admin/escalations', requireAuth, requireRole(['admin']), ModerationController.getEscalations);

export default router;
