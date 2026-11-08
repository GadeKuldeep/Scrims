import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.post('/', authenticate, bookingController.createBookingHold);
router.post('/:id/cancel', authenticate, bookingController.releaseHold);
router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/tournament/:tournamentId', authenticate, requireRole([ROLES.SUPER_ADMIN, ROLES.MATCH_MASTER]), bookingController.getTournamentBookings);

export default router;
