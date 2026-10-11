import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { requireAuth, requireActiveUser } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public plans endpoint
router.get('/plans', BillingController.getPlans);

// Office billing management (authenticated, object-level authorized)
router.get('/office/:officeId', requireAuth, requireActiveUser, BillingController.getOfficeBilling);
router.post('/office/:officeId/checkout', requireAuth, requireActiveUser, BillingController.createCheckout);
router.post('/office/:officeId/cancel', requireAuth, requireActiveUser, BillingController.cancelSubscription);
router.get('/office/:officeId/invoices', requireAuth, requireActiveUser, BillingController.getOfficeInvoices);
router.get('/office/:officeId/invoices/:id/pdf', requireAuth, requireActiveUser, BillingController.getInvoicePdf);

// Non-negotiable Rule 4: Data export is ALWAYS permitted, even on Basic or lapsed tiers
router.post('/office/:officeId/export', requireAuth, requireActiveUser, BillingController.exportOfficeData);

export default router;
