import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { ENV } from './config/env.js';
import { initializeSockets } from './sockets/index.js';
import { db } from './config/database.js';
import { setIO } from './socketInstance.js';

const server = http.createServer(app);

// Initialize Socket.IO Server
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setIO(io);
initializeSockets(io);

// Background Task: Auto-release expired 10-minute temporary holds
const HOLD_CLEANUP_INTERVAL_MS = 15 * 1000; // Every 15 seconds
const cleanupTimer = setInterval(async () => {
  try {
    await db.slots.releaseExpiredHolds();
  } catch (err) {
    console.error('[Hold Cleanup Error]', err.message);
  }
}, HOLD_CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

// Start Server if run directly
const PORT = ENV.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ==============================================================
    🚀 SCRIMS ESPORTS TOURNAMENT MANAGEMENT PLATFORM — BACKEND
    ==============================================================
    • API Server:     http://localhost:${PORT}
    • Health Check:   http://localhost:${PORT}/api/health
    • WebSocket:      ws://localhost:${PORT}
    • Timezone:       Asia/Kolkata (IST)
    • Mode:           ${ENV.NODE_ENV}
    ==============================================================
    `);
  });
}

export default server;
