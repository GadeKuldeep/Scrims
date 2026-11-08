import { Router } from 'express';
import { tournamentController } from '../controllers/tournamentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/', tournamentController.getTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/slots', tournamentController.getSlots);
router.get('/:id/room-credentials', authenticate, tournamentController.getRoomCredentials);

// Staff / Admin Endpoints
router.post('/', authenticate, requireRole([ROLES.SUPER_ADMIN, ROLES.MATCH_MASTER]), tournamentController.createTournament);
router.put('/:id', authenticate, requireRole([ROLES.SUPER_ADMIN, ROLES.MATCH_MASTER]), tournamentController.updateTournament);

export default router;
