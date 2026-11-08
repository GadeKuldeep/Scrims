import { db } from '../config/database.js';
import { ROLES, TOURNAMENT_STATUS } from '../config/constants.js';
import { getIO } from '../socketInstance.js';

let platformRegistrationFrozen = false;

export const adminController = {
  // Executive Dashboard Telemetry & Financial metrics
  getPlatformStats: async (req, res, next) => {
    try {
      const stats = await db.stats.getPlatformStats();
      res.json({
        success: true,
        stats: {
          ...stats,
          isRegistrationFrozen: platformRegistrationFrozen,
          cluster: 'Asia-S1 (Mumbai Node)',
          gatewayLatencyMs: 12,
          fairPlayComplianceRate: '100%',
          auditSyncPercentage: 99.8
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Users Directory
  getUsers: async (req, res, next) => {
    try {
      const users = await db.profiles.getAll();
      res.json({ success: true, users });
    } catch (err) {
      next(err);
    }
  },

  // Super Admin updates a user's role or assigns staff credentials
  updateUserRole: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role, staff_code } = req.body;

      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role specified.' });
      }

      const updated = await db.profiles.update(id, {
        role,
        staff_code: staff_code || (role === ROLES.MATCH_MASTER ? `MM-${Math.floor(100 + Math.random() * 900)}` : (role === ROLES.SCORE_MASTER ? `SM-${Math.floor(100 + Math.random() * 900)}` : null))
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'USER_ROLE_CHANGED',
        target_type: 'USER',
        target_id: id,
        metadata: { new_role: role, staff_code: updated.staff_code }
      });

      res.json({ success: true, message: `User role updated to ${role}.`, user: updated });
    } catch (err) {
      next(err);
    }
  },

  // Assign Match Master and Score Master to Tournament
  assignStaff: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { match_master_id, score_master_id } = req.body;

      const tournament = await db.tournaments.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found.' });
      }

      const updates = {};
      if (match_master_id) {
        const mm = await db.profiles.findById(match_master_id);
        if (!mm || (mm.role !== ROLES.MATCH_MASTER && mm.role !== ROLES.SUPER_ADMIN)) {
          return res.status(400).json({ success: false, error: 'Selected user is not a Match Master.' });
        }
        updates.assigned_match_master_id = match_master_id;
      }

      if (score_master_id) {
        const sm = await db.profiles.findById(score_master_id);
        if (!sm || (sm.role !== ROLES.SCORE_MASTER && sm.role !== ROLES.SUPER_ADMIN)) {
          return res.status(400).json({ success: false, error: 'Selected user is not a Score Master.' });
        }
        updates.assigned_score_master_id = score_master_id;
      }

      const updated = await db.tournaments.update(tournamentId, updates);

      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'STAFF_ASSIGNED',
        target_type: 'TOURNAMENT',
        target_id: tournamentId,
        metadata: updates
      });

      res.json({ success: true, message: 'Staff assigned successfully.', tournament: updated });
    } catch (err) {
      next(err);
    }
  },

  // Emergency Platform Freeze (registrations lock)
  toggleEmergencyFreeze: async (req, res, next) => {
    try {
      platformRegistrationFrozen = !platformRegistrationFrozen;

      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: platformRegistrationFrozen ? 'REGISTRATIONS_FROZEN' : 'REGISTRATIONS_UNFROZEN',
        target_type: 'PLATFORM',
        target_id: 'GLOBAL',
        metadata: { frozen: platformRegistrationFrozen }
      });

      const io = getIO();
      if (io) {
        io.emit('platform:alert', {
          title: platformRegistrationFrozen ? 'Emergency Registration Freeze' : 'Platform Resumed Normal Ops',
          frozen: platformRegistrationFrozen
        });
      }

      res.json({
        success: true,
        message: platformRegistrationFrozen ? 'Platform registrations FROZEN.' : 'Platform registrations RESUMED.',
        isRegistrationFrozen: platformRegistrationFrozen
      });
    } catch (err) {
      next(err);
    }
  },

  // Platform Audit Logs
  getAuditLogs: async (req, res, next) => {
    try {
      const logs = await db.auditLogs.getAll();
      res.json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }
};
