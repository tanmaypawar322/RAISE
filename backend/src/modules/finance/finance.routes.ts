import { Router } from 'express';
import { FinanceController } from './finance.controller.js';

const router = Router();

// Public ledger endpoints
router.get('/public-ledger', FinanceController.getPublicLedger);
router.get('/public-ledger/export-csv', FinanceController.exportCsv);

export default router;
