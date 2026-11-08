import { ROLES } from '../config/constants.js';
import { db } from '../config/database.js';

/**
 * Ensures user has at least one of the specified roles
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Authorized roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Validates that Match Master is specifically assigned to the tournament, or user is Super Admin
 */
export async function requireAssignedMatchMaster(req, res, next) {
  try {
    const tournamentId = req.params.tournamentId || req.body.tournamentId || req.params.id;
    if (!tournamentId) {
      return res.status(400).json({ success: false, error: 'Tournament ID is required.' });
    }

    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next(); // Super Admin bypasses assignment
    }

    if (req.user.role !== ROLES.MATCH_MASTER) {
      return res.status(403).json({ success: false, error: 'Match Master privileges required.' });
    }

    const tournament = await db.tournaments.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found.' });
    }

    if (tournament.assigned_match_master_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You are not the assigned Match Master for this tournament.'
      });
    }

    req.tournament = tournament;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Validates that Score Master is specifically assigned to the tournament, or user is Super Admin
 */
export async function requireAssignedScoreMaster(req, res, next) {
  try {
    const tournamentId = req.params.tournamentId || req.body.tournamentId || req.params.id;
    if (!tournamentId) {
      return res.status(400).json({ success: false, error: 'Tournament ID is required.' });
    }

    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (req.user.role !== ROLES.SCORE_MASTER) {
      return res.status(403).json({ success: false, error: 'Score Master privileges required.' });
    }

    const tournament = await db.tournaments.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found.' });
    }

    if (tournament.assigned_score_master_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You are not the assigned Score Master for this tournament.'
      });
    }

    req.tournament = tournament;
    next();
  } catch (err) {
    next(err);
  }
}
