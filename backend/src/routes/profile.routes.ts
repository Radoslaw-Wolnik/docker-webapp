import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate, requireAuth } from '../middleware/auth.middleware';
import { uploadAvatar } from '../middleware/upload.middleware';

const router = Router();

// All profile routes require authentication
router.use(requireAuth);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);
router.post('/avatar', uploadAvatar, ProfileController.updateAvatar);
router.get('/games/history', ProfileController.getGameHistory);

export default router;