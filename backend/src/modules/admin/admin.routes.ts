import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes require authenticated admin
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/claims', AdminController.getClaims);
router.post('/claims/:id/approve', AdminController.approveClaim);
router.post('/claims/:id/reject', AdminController.rejectClaim);
router.post('/claims/:id/request-info', AdminController.requestInfo);
router.post('/users/:id/temporary-password', AdminController.setTemporaryPassword);
router.post('/escalations/run-now', AdminController.runEscalations);
router.get('/jurisdictions', AdminController.getJurisdictions);
router.get('/stats', AdminController.getStats);
router.get('/metrics', AdminController.getPilotMetrics);
router.get('/metrics/export-csv', AdminController.exportPilotMetricsCsv);

export default router;
