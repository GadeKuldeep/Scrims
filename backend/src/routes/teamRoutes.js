import { Router } from 'express';
import { teamController } from '../controllers/teamController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, teamController.createTeam);
router.get('/my', authenticate, teamController.getMyTeam);
router.get('/:id', teamController.getTeamById);
router.post('/:teamId/invite', authenticate, teamController.inviteMember);
router.post('/invitations/:id/respond', authenticate, teamController.respondToInvitation);
router.delete('/:teamId/members/:userId', authenticate, teamController.removeMember);

export default router;
