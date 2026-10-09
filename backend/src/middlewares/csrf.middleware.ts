import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

/**
 * Strict Origin / Referer CSRF protection middleware for cookie-authenticated routes
 */
export function verifyCsrfOrigin(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods don't need CSRF check if read-only, but refresh/logout are POST
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const originHeader = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);

  // If no origin/referer is provided for state-changing cookie requests
  if (!originHeader) {
    // In production, reject missing origin on cookie requests
    if (config.nodeEnv === 'production') {
      res.status(403).json({
        success: false,
        message: 'CSRF security check failed: Missing request origin header.',
      });
      return;
    }
    // Allow in non-production for local curl/scripts without headers
    return next();
  }

  try {
    const originUrl = new URL(originHeader);
    const originHost = originUrl.host;

    const allowedHosts = new Set<string>();

    if (config.clientUrl) {
      try {
        allowedHosts.add(new URL(config.clientUrl).host);
      } catch {}
    }
    if (config.marketingUrl) {
      try {
        allowedHosts.add(new URL(config.marketingUrl).host);
      } catch {}
    }

    if (config.nodeEnv !== 'production') {
      allowedHosts.add('localhost:3000');
      allowedHosts.add('localhost:3001');
      allowedHosts.add('127.0.0.1:3000');
      allowedHosts.add('127.0.0.1:3001');
      allowedHosts.add('localhost:5000');
      allowedHosts.add('127.0.0.1:5000');
    }

    if (!allowedHosts.has(originHost)) {
      res.status(403).json({
        success: false,
        message: `CSRF security check failed: Origin '${originHost}' is not authorized.`,
      });
      return;
    }

    next();
  } catch {
    res.status(403).json({
      success: false,
      message: 'CSRF security check failed: Malformed origin header.',
    });
  }
}
