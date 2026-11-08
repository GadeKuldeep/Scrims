import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.post('/', authenticate, paymentController.submitPaymentProof);
router.get('/', authenticate, requireRole([ROLES.SUPER_ADMIN, ROLES.MATCH_MASTER]), paymentController.getPayments);
router.post('/:id/verify', authenticate, requireRole([ROLES.SUPER_ADMIN, ROLES.MATCH_MASTER]), paymentController.verifyPayment);
router.post('/:id/reject', authenticate, requireRole([ROLES.SUPER_ADMIN, ROLES.MATCH_MASTER]), paymentController.rejectPayment);

export default router;
