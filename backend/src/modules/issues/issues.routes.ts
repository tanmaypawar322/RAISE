import { Router } from 'express';
import multer from 'multer';
import { IssuesController } from './issues.controller.js';
import { requireAuth, optionalAuth, requireRole, gateApiAccess, gateIssueDetailAccess } from '../../middlewares/auth.middleware.js';

const router = Router();
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// Citizen personalized feeds (placed before /:id)
router.get('/my-issues', requireAuth, IssuesController.getMyIssues);
router.get('/my-supported', requireAuth, IssuesController.getMySupportedIssues);
router.get('/supported-by-me', requireAuth, IssuesController.getMySupportedIssues);
router.get('/office/:officeId', gateApiAccess, IssuesController.getOfficeIssues);

// Public issues feed (gated when APP_REQUIRE_LOGIN=true)
router.get('/', gateApiAccess, IssuesController.getIssues);
router.post('/suggest-office', gateApiAccess, IssuesController.suggestOffice);
router.get('/similar', gateApiAccess, IssuesController.getSimilarIssues);
router.post('/assisted', requireAuth, upload.array('media', 10), IssuesController.createAssistedIssue);
router.get('/:id', gateIssueDetailAccess, IssuesController.getIssueById);
router.post('/', gateApiAccess, upload.array('media', 10), IssuesController.createIssue);

// Citizen Actions
router.post('/:id/raise', requireAuth, IssuesController.raiseIssue);
router.post('/:id/confirm', requireAuth, IssuesController.confirmIssue);
router.post('/:id/dispute', requireAuth, IssuesController.disputeIssue);
router.post('/:id/flag', requireAuth, IssuesController.flagIssue);

// Official / Agency / Admin status updates
router.patch('/:id/status', requireAuth, requireRole(['official', 'agency', 'admin']), IssuesController.updateStatus);

// Merge & Unmerge routes
router.post('/:id/merge', requireAuth, requireRole(['official', 'admin']), IssuesController.mergeIssues);
router.post('/:id/unmerge', requireAuth, requireRole(['admin']), IssuesController.unmergeIssue);

export default router;
