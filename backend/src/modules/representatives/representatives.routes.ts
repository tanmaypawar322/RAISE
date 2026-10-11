import { Router } from 'express';
import { RepresentativesController } from './representatives.controller.js';
import { MilestoneController } from './milestone.controller.js';
import { requireAuth, requireRole, gateApiAccess, gateRecordPageAccess } from '../../middlewares/auth.middleware.js';

const router = Router();

// Representative Office Portal Workspace (Tabs: Asks, Taken up, Updates, Reports, Profile)
router.get('/workspace', requireAuth, requireRole(['official', 'admin']), RepresentativesController.getWorkspace);
router.post('/invite-staff', requireAuth, requireRole(['official', 'admin']), RepresentativesController.inviteStaff);

// Public Governance Directory (Neutral sorting, zero shame ranks)
router.get('/directory/governance', gateRecordPageAccess, RepresentativesController.getGovernanceDirectory);

// Citizen Facing Issue Interaction ("Who represents this place", "Ask MLA/MP", "Thank you")
router.get('/for-issue/:issueId', gateApiAccess, RepresentativesController.getRepresentativesForIssue);
router.post('/ask/:issueId/:repId', requireAuth, RepresentativesController.askRepresentative);
router.post('/take-up/:issueId', requireAuth, requireRole(['official', 'admin']), RepresentativesController.takeUpIssue);
router.post('/note/:issueId', requireAuth, requireRole(['official', 'admin']), RepresentativesController.postInquiryNote);
router.post('/thank/:issueId', requireAuth, RepresentativesController.thankRepresentative);

// Self-Reported Updates & Citizen Cross-Check (Confirm / Dispute)
router.post('/updates', requireAuth, requireRole(['official', 'admin']), RepresentativesController.createUpdate);
router.post('/updates/:id/confirm', requireAuth, RepresentativesController.confirmUpdate);
router.post('/updates/:id/dispute', requireAuth, RepresentativesController.disputeUpdate);

// Monthly Report Right-of-Reply (5-day window)
router.post('/reports/:id/reply', requireAuth, requireRole(['official', 'admin']), RepresentativesController.submitReportReply);

// Verified Milestone Portfolios & Citizen Audit
router.post('/milestones', requireAuth, requireRole(['official', 'admin']), MilestoneController.createMilestone);
router.get('/milestones/:id', gateRecordPageAccess, MilestoneController.getMilestoneDetail);
router.post('/milestones/:id/vote', requireAuth, MilestoneController.voteMilestone);
router.get('/:repId/milestones', gateRecordPageAccess, MilestoneController.getMilestones);

// Public Record Pages & Correction Requests
router.get('/:id', gateRecordPageAccess, RepresentativesController.getRepresentativePublicRecord);
router.post('/:id/correct', gateRecordPageAccess, RepresentativesController.submitCorrectionRequest);

export default router;

