import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getPlans, startCheckout, activatePlan } from '../controllers/payment.controller.js';

const router = Router();

router.get('/plans', getPlans);
router.post('/checkout', requireAuth, startCheckout);
router.post('/activate', requireAuth, activatePlan);

export default router;
