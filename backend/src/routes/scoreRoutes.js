import { Router } from 'express';
import { scoreController } from '../controllers/scoreController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Public leaderboard & map scores
router.get('/:tournamentId/map/:mapName', scoreController.getMapScores);
router.get('/:tournamentId/leaderboard', scoreController.getAggregateLeaderboard);
router.get('/:tournamentId/history', scoreController.getScoreHistory);

// Score Master rapid score update
router.post(
  '/:tournamentId/score',
  authenticate,
  requireRole([ROLES.SCORE_MASTER, ROLES.SUPER_ADMIN]),
  scoreController.updateMapScore
);

export default router;
