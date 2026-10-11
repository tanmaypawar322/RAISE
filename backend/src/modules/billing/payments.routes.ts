import { Router } from 'express';
import { PaymentsWebhookController } from './payments-webhook.controller.js';

const router = Router();

// Raw body is captured by express.json({ verify: ... }) in app.ts
router.post('/webhook', PaymentsWebhookController.handleWebhook);

export default router;
