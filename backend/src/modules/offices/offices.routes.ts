import { Router } from 'express';
import { OfficesController } from './offices.controller.js';
import { requireAuth, requireRole, gateApiAccess, gateRecordPageAccess } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', gateApiAccess, OfficesController.getOffices);
router.get('/jurisdictions', gateApiAccess, OfficesController.getJurisdictions);
router.get('/suggest', gateApiAccess, OfficesController.suggestOffice);
router.get('/:id', gateRecordPageAccess, OfficesController.getOfficeById);
router.get('/:id/reports', gateRecordPageAccess, OfficesController.getReports);

router.post('/:id/correct', gateRecordPageAccess, OfficesController.submitCorrectionRequest);
router.post('/:id/claim', requireAuth, OfficesController.claimOffice);
router.post(
  '/:id/reports',
  requireAuth,
  requireRole(['official', 'admin']),
  OfficesController.publishReport
);
router.post(
  '/:id/invites',
  requireAuth,
  requireRole(['official', 'admin']),
  OfficesController.createInvite
);

export default router;

