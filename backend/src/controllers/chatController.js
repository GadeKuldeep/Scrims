import { db } from '../config/database.js';
import { ROLES } from '../config/constants.js';
import { getIO } from '../socketInstance.js';

export const chatController = {
  getMessages: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const tournament = await db.tournaments.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found.' });
      }

      // Authorization check: User must be participant or assigned staff/admin
      const isStaffOrAdmin = 
        req.user.role === ROLES.SUPER_ADMIN || 
        tournament.assigned_match_master_id === req.user.id || 
        tournament.assigned_score_master_id === req.user.id;

      const participant = await db.tournamentParticipants.findByUserId(tournamentId, req.user.id);

      if (!isStaffOrAdmin && !participant) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You must be a confirmed participant or assigned staff to access this tournament chat.'
        });
      }

      const messages = await db.chatMessages.findByTournamentId(tournamentId, 100);
      res.json({ success: true, messages });
    } catch (err) {
      next(err);
    }
  },

  postMessage: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { message, message_type } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
      }

      const tournament = await db.tournaments.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found.' });
      }

      const isStaffOrAdmin = 
        req.user.role === ROLES.SUPER_ADMIN || 
        tournament.assigned_match_master_id === req.user.id || 
        tournament.assigned_score_master_id === req.user.id;

      const participant = await db.tournamentParticipants.findByUserId(tournamentId, req.user.id);

      if (!isStaffOrAdmin && !participant) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only authorized tournament members can post messages.'
        });
      }

      // Only staff/admin can post ANNOUNCEMENT
      let type = 'CHAT';
      if (message_type === 'ANNOUNCEMENT' && isStaffOrAdmin) {
        type = 'ANNOUNCEMENT';
      }

      const chatMsg = await db.chatMessages.create({
        tournament_id: tournamentId,
        user_id: req.user.id,
        username: req.user.username,
        user_role: req.user.role,
        avatar_url: req.user.avatar_url || '',
        message: message.trim(),
        message_type: type
      });

      // Broadcast to Socket.IO tournament room
      const io = getIO();
      if (io) {
        io.to(`tournament:${tournamentId}`).emit('chat:message', chatMsg);
      }

      res.status(201).json({ success: true, message: chatMsg });
    } catch (err) {
      next(err);
    }
  }
};
