import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { db } from '../config/database.js';
import { ROLES } from '../config/constants.js';

export function initializeSockets(io) {
  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        // Allow unauthenticated connection for public scoreboard watching, but flag socket
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await db.profiles.findById(decoded.id);
      if (user) {
        socket.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          staff_code: user.staff_code,
          avatar_url: user.avatar_url
        };
      }
      next();
    } catch (err) {
      // Don't kill socket; allow read-only
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userDisplay = socket.user ? `${socket.user.username} [${socket.user.role}]` : 'Guest / Spectator';
    console.log(`[Socket.IO] Connected: ${socket.id} (${userDisplay})`);

    // Join tournament room
    socket.on('room:join', async ({ tournamentId }) => {
      if (!tournamentId) return;

      const roomKey = `tournament:${tournamentId}`;
      socket.join(roomKey);
      console.log(`[Socket.IO] ${socket.id} joined ${roomKey}`);

      // Broadcast user presence in room
      if (socket.user) {
        socket.to(roomKey).emit('room:user_joined', {
          user: socket.user,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Leave tournament room
    socket.on('room:leave', ({ tournamentId }) => {
      if (!tournamentId) return;
      const roomKey = `tournament:${tournamentId}`;
      socket.leave(roomKey);
      console.log(`[Socket.IO] ${socket.id} left ${roomKey}`);
    });

    // Send chat message through socket
    socket.on('chat:send', async ({ tournamentId, message, message_type }) => {
      if (!socket.user) {
        return socket.emit('error', { message: 'Must be logged in to chat.' });
      }

      if (!message || message.trim().length === 0) return;

      try {
        const tournament = await db.tournaments.findById(tournamentId);
        if (!tournament) return;

        // Role check for announcements
        const isStaff = [ROLES.SUPER_ADMIN, ROLES.MATCH_MASTER, ROLES.SCORE_MASTER].includes(socket.user.role);
        const type = (message_type === 'ANNOUNCEMENT' && isStaff) ? 'ANNOUNCEMENT' : 'CHAT';

        const chatMsg = await db.chatMessages.create({
          tournament_id: tournamentId,
          user_id: socket.user.id,
          username: socket.user.username,
          user_role: socket.user.role,
          avatar_url: socket.user.avatar_url || '',
          message: message.trim(),
          message_type: type
        });

        // Broadcast to everyone in the tournament room
        io.to(`tournament:${tournamentId}`).emit('chat:message', chatMsg);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Typing indicator
    socket.on('chat:typing', ({ tournamentId, isTyping }) => {
      if (socket.user && tournamentId) {
        socket.to(`tournament:${tournamentId}`).emit('chat:user_typing', {
          username: socket.user.username,
          isTyping
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected: ${socket.id}`);
    });
  });
}
