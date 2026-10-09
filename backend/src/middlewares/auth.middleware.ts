import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export interface AuthUserPayload {
  userId: string;
  role: 'citizen' | 'official' | 'agency' | 'moderator' | 'admin';
  displayName: string;
  email?: string;
  status?: 'active' | 'pending' | 'suspended' | 'deleted';
  isOfficialVerified?: boolean;
  tokenVersion?: number;
  officialOfficeId?: string;
  officeMemberships?: Array<{
    officeId: string;
    memberRole: string;
    status: string;
  }>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;

    // In-depth check against database tokenVersion for immediate revocation
    if (mongoose.connection.readyState === 1) {
      const dbUser = await User.findById(decoded.userId).select(
        'tokenVersion status role displayName email officialOfficeId isOfficialVerified officeMemberships'
      );

      if (!dbUser) {
        res.status(401).json({ success: false, message: 'User account not found.' });
        return;
      }

      // Check tokenVersion match
      if (decoded.tokenVersion !== undefined && (dbUser.tokenVersion || 0) !== decoded.tokenVersion) {
        res.status(401).json({
          success: false,
          message: 'Session has been revoked or invalidated. Please sign in again.',
        });
        return;
      }

      if (dbUser.status === 'deleted') {
        res.status(401).json({ success: false, message: 'Account has been deleted.' });
        return;
      }

      if (dbUser.status === 'suspended') {
        res.status(403).json({ success: false, message: 'Account has been suspended.' });
        return;
      }

      req.user = {
        userId: dbUser._id.toString(),
        role: dbUser.role,
        displayName: dbUser.displayName,
        email: dbUser.email,
        status: dbUser.status,
        isOfficialVerified: dbUser.isOfficialVerified,
        tokenVersion: dbUser.tokenVersion || 0,
        officialOfficeId: dbUser.officialOfficeId?.toString(),
        officeMemberships: dbUser.officeMemberships?.map((m) => ({
          officeId: m.officeId.toString(),
          memberRole: m.memberRole,
          status: m.status,
        })),
      };
    } else {
      req.user = decoded;
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;

      if (mongoose.connection.readyState === 1) {
        const dbUser = await User.findById(decoded.userId).select('tokenVersion status role displayName email');
        if (dbUser && dbUser.tokenVersion === decoded.tokenVersion && dbUser.status !== 'suspended') {
          req.user = decoded;
        }
      } else {
        req.user = decoded;
      }
    } catch {
      // Ignore token failure for optional auth
    }
  }
  next();
}

/**
 * Ensures user account is active. Blocks pending or suspended accounts from privileged actions.
 */
export function requireActiveUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }
  if (req.user.status === 'pending') {
    res.status(403).json({
      success: false,
      message: 'Account pending verification. Privileged actions require approved status.',
    });
    return;
  }
  if (req.user.status === 'suspended') {
    res.status(403).json({
      success: false,
      message: 'Account has been suspended.',
    });
    return;
  }
  next();
}

/**
 * Checks role permission and strictly enforces active status for privileged roles.
 */
export function requireRole(allowedRoles: Array<'citizen' | 'official' | 'agency' | 'moderator' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access denied: insufficient permissions.' });
      return;
    }

    if (['official', 'agency', 'admin'].includes(req.user.role) && req.user.status === 'pending') {
      res.status(403).json({
        success: false,
        message: 'Account pending verification. Privileged actions require approved status.',
      });
      return;
    }

    if (req.user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Account has been suspended.',
      });
      return;
    }

    next();
  };
}
