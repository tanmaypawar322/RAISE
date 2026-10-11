import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { requireAuth, requireRole, gateRecordPageAccess } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public printable monthly report routes (subject to app gate / PUBLIC_RECORD_PAGES)
router.get('/rep/:representativeId/:month', gateRecordPageAccess, ReportsController.getRepresentativeMonthlyReport);
router.get('/office/:officeId/:month', gateRecordPageAccess, ReportsController.getOfficeMonthlyReport);

// Office right of reply submission
router.post('/office/:reportId/reply', requireAuth, requireRole(['official', 'admin']), ReportsController.submitOfficeReportReply);

export default router;
