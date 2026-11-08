import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Allow inline scripts/styles for development
}));

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins for dev/preview; production can restrict via ENV.FRONTEND_URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting (100 requests per minute per IP for public endpoints)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use('/api', apiLimiter);

// URL Normalization: handle duplicate /api/api prefixes if requested by misconfigured proxies or clients
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// Health Check & Root Alive Probe
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SCRIMS Esports Tournament Management API',
    cluster: 'Asia-S1',
    timeIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    version: '2.4.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SCRIMS Esports Tournament Management API',
    cluster: 'Asia-S1',
    timeIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    version: '2.4.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Catch-all
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.url}` });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
