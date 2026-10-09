import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';

export interface AuditEventParams {
  actorId?: mongoose.Types.ObjectId | string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: mongoose.Types.ObjectId | string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export class AuditService {
  static async log(event: AuditEventParams): Promise<void> {
    try {
      const sanitizedDetails = event.details ? { ...event.details } : undefined;
      // Guarantee sensitive credentials and PII are never logged
      if (sanitizedDetails) {
        delete sanitizedDetails.password;
        delete sanitizedDetails.passwordHash;
        delete sanitizedDetails.otp;
        delete sanitizedDetails.token;
        delete sanitizedDetails.phone;
        delete sanitizedDetails.email;
        delete sanitizedDetails.secret;
      }

      await AuditLog.create({
        actorId: event.actorId ? new mongoose.Types.ObjectId(event.actorId.toString()) : undefined,
        actorRole: event.actorRole,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId ? event.targetId.toString() : undefined,
        ip: event.ip,
        userAgent: event.userAgent,
        details: sanitizedDetails,
      });

      if (process.env.NODE_ENV !== 'production') {
        const actorStr = event.actorId ? `${event.actorRole || 'user'}:${event.actorId}` : 'system';
        console.log(`[AUDIT] [${event.action}] by ${actorStr} -> target:${event.targetType || 'none'}:${event.targetId || ''}`);
      }
    } catch (err) {
      console.error('[AUDIT-LOG-ERROR] Failed to persist audit log entry:', err);
    }
  }
}
