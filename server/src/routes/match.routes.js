import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getSuggestions,
  swipe,
  listMatches,
  stats,
  sendMessage,
} from '../controllers/match.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/suggestions', getSuggestions);
router.post('/swipe', swipe);
router.get('/mine', listMatches);
router.get('/stats', stats);
router.post('/:matchId/messages', sendMessage);

export default router;

