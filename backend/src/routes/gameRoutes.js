import { Router } from 'express';
import { gameController } from '../controllers/gameController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/', gameController.getGames);
router.get('/:id', gameController.getGameById);
router.put('/:id', authenticate, requireRole([ROLES.SUPER_ADMIN]), gameController.updateGame);

export default router;
