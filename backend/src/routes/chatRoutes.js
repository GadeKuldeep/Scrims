import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:tournamentId/messages', authenticate, chatController.getMessages);
router.post('/:tournamentId/messages', authenticate, chatController.postMessage);

export default router;
