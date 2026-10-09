import { Router } from 'express';
import { OfficesController } from './offices.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', OfficesController.getOffices);
router.get('/suggest', OfficesController.suggestOffice);
router.get('/:id', OfficesController.getOfficeById);
router.get('/:id/reports', OfficesController.getReports);

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
