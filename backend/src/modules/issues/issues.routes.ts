import { Router } from 'express';
import multer from 'multer';
import { IssuesController } from './issues.controller.js';
import { requireAuth, optionalAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Citizen personalized feeds (placed before /:id)
router.get('/my-issues', requireAuth, IssuesController.getMyIssues);
router.get('/my-supported', requireAuth, IssuesController.getMySupportedIssues);
router.get('/office/:officeId', IssuesController.getOfficeIssues);

// Public issues feed
router.get('/', IssuesController.getIssues);
router.post('/suggest-office', IssuesController.suggestOffice);
router.get('/similar', IssuesController.getSimilarIssues);
router.get('/map-bounds', IssuesController.getMapBounds);
router.get('/:id', optionalAuth, IssuesController.getIssueById);
router.post('/', optionalAuth, upload.array('media', 4), IssuesController.createIssue);

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
