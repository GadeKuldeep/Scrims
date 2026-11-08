import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Super Admin Protected Endpoints
router.use(authenticate, requireRole([ROLES.SUPER_ADMIN]));

router.get('/stats', adminController.getPlatformStats);
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/tournaments/:tournamentId/staff', adminController.assignStaff);
router.post('/emergency-freeze', adminController.toggleEmergencyFreeze);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
