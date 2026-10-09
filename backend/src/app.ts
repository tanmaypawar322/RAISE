import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import issuesRoutes from './modules/issues/issues.routes.js';
import officesRoutes from './modules/offices/offices.routes.js';
import moderationRoutes from './modules/moderation/moderation.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy:
      config.nodeEnv === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'", 'blob:'],
              frameSrc: ["'none'"],
            },
          }
        : false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Dynamic CORS configuration allowing credentials for cookies
const allowedOrigins = [
  config.clientUrl,
  config.marketingUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (config.nodeEnv !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('CORS policy: Request origin not allowed.'));
    },
    credentials: true,
  })
);

// Correlation and Request ID tracking
app.use((req, res, next) => {
  const correlationId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = correlationId;
  res.setHeader('x-request-id', correlationId);
  next();
});

// Structured logging with request ID tracking
if (config.nodeEnv === 'production') {
  app.use(
    morgan((tokens, req, res) => {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('x-request-id'),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: Number(tokens.status(req, res)),
        responseTimeMs: Number(tokens['response-time'](req, res)),
        ip: req.ip,
      });
    })
  );
} else {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms [reqId: :res[x-request-id]]'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploads directory statically for development media
const uploadPath = path.resolve(process.cwd(), config.localUploadDir);
app.use('/uploads', express.static(uploadPath));

// Static liveness probe
app.get(['/healthz', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'RAISE API (Report • Amplify • Inform • Solve • Escalate)',
    version: '1.0.0',
    env: config.nodeEnv,
  });
});

// Deep readiness probe verifying database connectivity
app.get(['/ready', '/api/ready'], async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
        readyState: mongoose.connection.readyState,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }

    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'not_ready',
      database: 'error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

import { EmailService } from './services/email/email.service.js';
import { getDevMailbox, clearDevMailbox } from './services/email/dev-mailbox.js';

EmailService.init();

// Dev Mailbox (active only outside production and when DEV_MAILBOX=true)
if (config.devMailbox) {
  app.get('/api/dev/mailbox', (req, res) => {
    res.json({ success: true, emails: getDevMailbox() });
  });
  app.post('/api/dev/mailbox/clear', (req, res) => {
    clearDevMailbox();
    res.json({ success: true, message: 'Dev mailbox cleared' });
  });
}

// Domain routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/offices', officesRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error Handler
app.use(errorHandler);

export default app;
