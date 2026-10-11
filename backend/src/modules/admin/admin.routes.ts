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
router.get('/outreach', AdminController.getOutreachQueue);
router.put('/outreach/:targetType/:targetId', AdminController.updateOutreachRecord);
router.get('/outreach/export-csv', AdminController.exportOutreachCsv);
router.get('/corrections', AdminController.getCorrections);
router.put('/corrections/:id', AdminController.updateCorrection);

router.get('/rep-updates', AdminController.getRepresentativeUpdates);
router.post('/rep-updates/:id/approve', AdminController.approveRepresentativeUpdate);
router.post('/rep-updates/:id/reject', AdminController.rejectRepresentativeUpdate);

router.get('/freeze-windows', AdminController.getFreezeWindows);
router.post('/freeze-windows', AdminController.createFreezeWindow);
router.put('/freeze-windows/:id', AdminController.updateFreezeWindow);
router.delete('/freeze-windows/:id', AdminController.deleteFreezeWindow);

router.post('/reports/generate', AdminController.triggerGenerateMonthlyReports);
router.post('/reports/publish-due', AdminController.triggerPublishDueReports);

// Billing administration
import { AdminBillingController } from '../billing/admin-billing.controller.js';
router.get('/billing/overview', AdminBillingController.getOverview);
router.post('/billing/subscriptions', AdminBillingController.createInvoiceModeSubscription);
router.post('/billing/invoices', AdminBillingController.createInvoice);
router.post('/billing/invoices/:id/mark-paid', AdminBillingController.markInvoicePaid);
router.patch('/billing/plans/:key', AdminBillingController.updatePlan);

// Donation administration
import { DonationsController } from '../donations/donations.controller.js';
router.post('/donations/:id/refund', DonationsController.refundDonation);

// Finance administration
import { FinanceController } from '../finance/finance.controller.js';
router.get('/finance/entries', FinanceController.getAdminEntries);
router.post('/finance/entries', FinanceController.createAdminEntry);
router.delete('/finance/entries/:id', FinanceController.deleteAdminEntry);

export default router;
