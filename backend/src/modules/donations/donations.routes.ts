import { Router } from 'express';
import { DonationsController } from './donations.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Guest or authenticated donation initiation
router.post('/', optionalAuth, DonationsController.createDonation);
router.get('/receipt/:receiptNumber', DonationsController.getReceipt);
router.get('/supporters', DonationsController.getSupportersList);
router.post('/cancel-monthly', DonationsController.cancelMonthly);

export default router;
