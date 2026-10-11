import { Router } from 'express';
import { AnalysisController } from './analysis.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// Executive analysis routes require authentication (officials & admins)
router.use(requireAuth);
router.use(requireRole(['official', 'admin']));

router.get('/dashboard', AnalysisController.getExecutiveDashboard);
router.get('/export-csv', AnalysisController.exportAnalysisCsv);

export default router;
