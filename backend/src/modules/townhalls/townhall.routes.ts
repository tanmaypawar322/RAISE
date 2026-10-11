import { Router } from 'express';
import { TownhallController } from './townhall.controller.js';
import { requireAuth, requireRole, gateApiAccess } from '../../middlewares/auth.middleware.js';

const router = Router();

// List deliberative topics
router.get('/', gateApiAccess, TownhallController.getTopics);

// Get topic details and discussion
router.get('/:id', gateApiAccess, TownhallController.getTopicById);

// Create new townhall topic
router.post('/', requireAuth, TownhallController.createTopic);

// Vote on individual clause
router.post('/:id/clauses/:clauseId/vote', requireAuth, TownhallController.voteClause);

// Post structured feedback / amendment
router.post('/:id/feedback', requireAuth, TownhallController.addFeedback);

// Upvote constructive feedback
router.post('/feedback/:id/upvote', requireAuth, TownhallController.upvoteFeedback);

// Post official government / Gram Panchayat response
router.post('/:id/respond', requireAuth, requireRole(['official', 'admin']), TownhallController.addOfficialResponse);

export default router;
