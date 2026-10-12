import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response, Request } from 'express';
import mongoose from 'mongoose';
import { RefreshToken, IRefreshToken } from '../models/RefreshToken.js';
import { User, IUser } from '../models/User.js';
import { config } from '../config/env.js';

export interface SessionResult {
  accessToken: string;
  rawRefreshToken: string;
  maxAgeMs: number;
}

export class SessionService {
  public static COOKIE_NAME = 'refreshToken';

  /**
   * Determine session lifetime based on role and public computer flag:
   * - 12 hours on public/shared computer
   * - 30 days for mobile citizens
   * - 7 days for officials and administrators
   */
  public static getSessionDuration(role: string, isPublicComputer: boolean = false): number {
    if (isPublicComputer) {
      return 12 * 60 * 60 * 1000; // 12 hours
    }
    if (role === 'citizen') {
      return 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    return 7 * 24 * 60 * 60 * 1000; // 7 days for official / admin
  }

  /**
   * Create a new session with 15-minute access token and long-lived refresh token
   */
  public static async createSession(
    user: IUser,
    isPublicComputer: boolean = false,
    req?: Request
  ): Promise<SessionResult> {
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = crypto.randomUUID();
    const maxAgeMs = this.getSessionDuration(user.role, isPublicComputer);
    const expiresAt = new Date(Date.now() + maxAgeMs);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      familyId,
      rotationCounter: 1,
      isRevoked: false,
      expiresAt,
      isPublicComputer,
      userAgent: req?.headers['user-agent'],
      ipAddress: (req?.ip || req?.socket?.remoteAddress || '').replace(/^::ffff:/, ''),
    });

    const accessToken = this.generateAccessToken(user, isPublicComputer);

    return {
      accessToken,
      rawRefreshToken,
      maxAgeMs,
    };
  }

  /**
   * Rotate refresh token.
   * If a previously-used (revoked) token is presented, REUSE DETECTION triggers:
   * all tokens in the family are revoked and the user's tokenVersion is incremented.
   */
  public static async rotateSession(
    rawRefreshToken: string,
    req?: Request
  ): Promise<
    | { success: true; accessToken: string; newRawRefreshToken: string; maxAgeMs: number; user: IUser }
    | { success: false; reason: 'invalid_token' | 'reuse_detected' | 'expired' | 'user_suspended' | 'user_not_found' }
  > {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const tokenDoc = await RefreshToken.findOne({ tokenHash });

    if (!tokenDoc) {
      return { success: false, reason: 'invalid_token' };
    }

    // Reuse detection
    if (tokenDoc.isRevoked) {
      console.warn(
        `[SECURITY ALERT] Refresh token reuse detected! Family: ${tokenDoc.familyId}, User: ${tokenDoc.userId}. Revoking entire session lineage.`
      );
      // Invalidate the entire token family immediately
      await RefreshToken.updateMany({ familyId: tokenDoc.familyId }, { isRevoked: true });
      // Invalidate all access tokens by bumping tokenVersion
      await User.findByIdAndUpdate(tokenDoc.userId, { $inc: { tokenVersion: 1 } });
      return { success: false, reason: 'reuse_detected' };
    }

    // Expiry check
    if (tokenDoc.expiresAt < new Date()) {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
      return { success: false, reason: 'expired' };
    }

    // User status check
    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return { success: false, reason: 'user_not_found' };
    }
    if (user.status === 'suspended') {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
      return { success: false, reason: 'user_suspended' };
    }

    // Invalidate current token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    // Generate rotated token in same family
    const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
    const maxAgeMs = this.getSessionDuration(user.role, tokenDoc.isPublicComputer);
    const newExpiresAt = new Date(Date.now() + maxAgeMs);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newTokenHash,
      familyId: tokenDoc.familyId,
      rotationCounter: tokenDoc.rotationCounter + 1,
      isRevoked: false,
      expiresAt: newExpiresAt,
      isPublicComputer: tokenDoc.isPublicComputer,
      userAgent: req?.headers['user-agent'],
      ipAddress: (req?.ip || req?.socket?.remoteAddress || '').replace(/^::ffff:/, ''),
    });

    const accessToken = this.generateAccessToken(user, tokenDoc.isPublicComputer);

    return {
      success: true,
      accessToken,
      newRawRefreshToken,
      maxAgeMs,
      user,
    };
  }

  /**
   * Revoke single session
   */
  public static async revokeSession(rawRefreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
  }

  /**
   * Revoke all sessions across all devices for a user (sign out all devices / password change)
   */
  public static async revokeAllUserSessions(userId: string | mongoose.Types.ObjectId): Promise<void> {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  }

  /**
   * Generate 15-minute access token JWT
   */
  public static generateAccessToken(user: IUser, isPublicComputer?: boolean): string {
    return jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        displayName: user.displayName,
        email: user.email,
        status: user.status,
        isOfficialVerified: user.isOfficialVerified,
        officialOfficeId: user.officialOfficeId?.toString(),
        tokenVersion: user.tokenVersion || 0,
      },
      config.jwtSecret,
      { expiresIn: '15m' }
    );
  }

  /**
   * Set httpOnly Secure SameSite=Lax cookie on response
   */
  public static setRefreshCookie(res: Response, rawRefreshToken: string, maxAgeMs: number): void {
    res.cookie(this.COOKIE_NAME, rawRefreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: maxAgeMs,
    });
  }

  /**
   * Clear refresh cookie from response
   */
  public static clearRefreshCookie(res: Response): void {
    res.clearCookie(this.COOKIE_NAME, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });
  }
}
