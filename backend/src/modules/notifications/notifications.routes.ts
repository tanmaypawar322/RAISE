import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// All notification operations require authentication
router.use(requireAuth);

// Notification feed & read status
router.get('/', NotificationsController.getNotifications);
router.post('/read-all', NotificationsController.markAllAsRead);
router.post('/:id/read', NotificationsController.markAsRead);

// User notification preferences
router.get('/preferences', NotificationsController.getPreferences);
router.patch('/preferences', NotificationsController.updatePreferences);

export default router;
