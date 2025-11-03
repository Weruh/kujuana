import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCurrentProfile, updateProfile, getOnboardingChecklist } from '../controllers/profile.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getCurrentProfile);
router.put('/me', updateProfile);
router.get('/me/checklist', getOnboardingChecklist);

export default router;
