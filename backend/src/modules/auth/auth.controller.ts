import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser } from '../../models/User.js';
import { Office } from '../../models/Office.js';
import { OfficeClaim } from '../../models/OfficeClaim.js';
import { OfficeInvite } from '../../models/OfficeInvite.js';
import { PasswordResetToken } from '../../models/PasswordResetToken.js';
import { OtpService } from '../../services/otp.service.js';
import { StorageService } from '../../services/storage.service.js';
import { SessionService } from '../../services/session.service.js';
import { EmailService } from '../../services/email/email.service.js';
import { AuditService } from '../../services/audit.service.js';
import { PasswordUtil } from '../../utils/password.util.js';
import { EmailUtil } from '../../utils/email.util.js';
import { config } from '../../config/env.js';
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotp,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
} from '../../utils/totp.util.js';

export const RegisterSchema = z
  .object({
    displayName: z.string().min(2).max(40).optional(),
    name: z.string().min(2).max(60).optional(),
    email: z.string().email(),
    password: z.string().min(10).max(128),
    phone: z.string().optional(),
    language: z.enum(['mr', 'hi', 'en']).optional().default('en'),
    isPublicComputer: z.boolean().optional(),
    turnstileToken: z.string().optional(),
  })
  .strict();

export const LoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1).max(128),
    isPublicComputer: z.boolean().optional(),
    turnstileToken: z.string().optional(),
  })
  .strict();

export const ForgotPasswordSchema = z
  .object({
    email: z.string().email(),
    turnstileToken: z.string().optional(),
  })
  .strict();

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(20).max(128),
    newPassword: z.string().min(10).max(128),
  })
  .strict();

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(10).max(128),
  })
  .strict();

export const AddPhoneSchema = z
  .object({
    phone: z.string().min(10).max(18),
    otp: z.string().length(6),
  })
  .strict();

export const RequestOtpSchema = z
  .object({
    phone: z.string().min(10).max(18),
    turnstileToken: z.string().optional(),
    purpose: z.enum(['login', 'delete_account']).optional().default('login'),
  })
  .strict();

export const DeleteAccountSchema = z
  .object({
    password: z.string().optional(),
    otp: z.string().length(6).optional(),
  })
  .strict();

export const VerifyOtpSchema = z
  .object({
    phone: z.string().min(10).max(18),
    otp: z.string().length(6),
    language: z.enum(['mr', 'hi', 'en']).optional(),
    isPublicComputer: z.boolean().optional(),
  })
  .strict();

export const UpdateProfileSchema = z
  .object({
    displayName: z.string().min(2).max(40).optional(),
    homeWard: z.string().min(1).max(100).optional(),
    language: z.enum(['mr', 'hi', 'en']).optional(),
    consent: z
      .object({
        consentVersion: z.string().min(1),
        consented: z.boolean(),
      })
      .optional(),
  })
  .strict();

export const ClaimOfficeSchema = z
  .object({
    name: z.string().min(2).max(60),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    phone: z.string().min(10).max(18),
    otp: z.string().length(6),
    officeId: z.string().min(1),
    role: z.enum(['official', 'agency']).default('official'),
    designation: z.string().min(2).max(100),
    employeeId: z.string().max(50).optional(),
    claimNotes: z.string().max(1000).optional(),
    isPublicComputer: z.boolean().optional(),
  })
  .strict();

export const AcceptInviteSchema = z
  .object({
    token: z.string().min(10),
    name: z.string().min(2).max(60),
    password: z.string().min(8).max(100),
    phone: z.string().min(10).max(18),
    otp: z.string().length(6),
    isPublicComputer: z.boolean().optional(),
  })
  .strict();

export const Verify2FaSetupSchema = z
  .object({
    token: z.string().length(6),
  })
  .strict();

export const Verify2FaLoginSchema = z
  .object({
    tempToken: z.string().min(10),
    code: z.string().min(6).max(12),
    isPublicComputer: z.boolean().optional(),
  })
  .strict();

interface FailedLoginTracker {
  attempts: number;
  lockUntil: number;
}
const failedLoginsByEmail = new Map<string, FailedLoginTracker>();
const failedLoginsByIp = new Map<string, FailedLoginTracker>();

export function checkLoginLockout(emailKey: string, ip: string): { locked: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const emailRecord = failedLoginsByEmail.get(emailKey);
  if (emailRecord && emailRecord.lockUntil > now) {
    return { locked: true, retryAfterSec: Math.ceil((emailRecord.lockUntil - now) / 1000) };
  }
  const ipRecord = failedLoginsByIp.get(ip);
  if (ipRecord && ipRecord.lockUntil > now) {
    return { locked: true, retryAfterSec: Math.ceil((ipRecord.lockUntil - now) / 1000) };
  }
  return { locked: false };
}

export function recordFailedLogin(emailKey: string, ip: string): void {
  const now = Date.now();
  const emailRec = failedLoginsByEmail.get(emailKey) || { attempts: 0, lockUntil: 0 };
  emailRec.attempts++;
  if (emailRec.attempts >= 5) {
    emailRec.lockUntil = now + 15 * 60 * 1000;
  }
  failedLoginsByEmail.set(emailKey, emailRec);

  const ipRec = failedLoginsByIp.get(ip) || { attempts: 0, lockUntil: 0 };
  ipRec.attempts++;
  if (ipRec.attempts >= 10) {
    ipRec.lockUntil = now + 15 * 60 * 1000;
  }
  failedLoginsByIp.set(ip, ipRec);
}

export function clearFailedLogin(emailKey: string): void {
  failedLoginsByEmail.delete(emailKey);
}

const forgotPasswordEmailLimits = new Map<string, { count: number; resetAt: number }>();
const forgotPasswordIpLimits = new Map<string, { count: number; resetAt: number }>();

export function checkForgotPasswordRateLimit(emailKey: string, ip: string): boolean {
  const now = Date.now();
  const emailLimit = forgotPasswordEmailLimits.get(emailKey);
  if (!emailLimit || now > emailLimit.resetAt) {
    forgotPasswordEmailLimits.set(emailKey, { count: 1, resetAt: now + 3600 * 1000 });
  } else if (emailLimit.count >= 3) {
    return false;
  } else {
    emailLimit.count++;
  }

  const ipLimit = forgotPasswordIpLimits.get(ip);
  if (!ipLimit || now > ipLimit.resetAt) {
    forgotPasswordIpLimits.set(ip, { count: 1, resetAt: now + 3600 * 1000 });
  } else if (ipLimit.count >= 10) {
    return false;
  } else {
    ipLimit.count++;
  }

  return true;
}

export function clearAuthLimitsForTesting(): void {
  failedLoginsByEmail.clear();
  failedLoginsByIp.clear();
  forgotPasswordEmailLimits.clear();
  forgotPasswordIpLimits.clear();
}

function sanitizeUser(user: IUser) {
  return {
    id: user._id,
    displayName: user.displayName,
    phoneMasked: user.phoneMasked,
    email: user.email ? EmailUtil.mask(user.email) : undefined,
    emailVerified: Boolean(user.emailVerified),
    verifiedMethods: user.verifiedMethods || [],
    needsPasswordChange: Boolean(user.needsPasswordChange),
    language: user.language,
    role: user.role,
    status: user.status,
    homeWard: user.homeWard || user.homeArea?.ward,
    isProfileComplete: Boolean(user.isProfileComplete),
    officialOfficeId: user.officialOfficeId,
    isOfficialVerified: Boolean(user.isOfficialVerified),
    designation: user.designation,
    employeeId: user.employeeId,
    officeMemberships: user.officeMemberships,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    consentVersion: user.consentVersion,
    createdAt: user.createdAt,
  };
}

export class AuthController {
  /**
   * Citizen registration with email + password (no verification email/code sent, active immediately).
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!config.authAllowEmailPassword) {
        res.status(403).json({ success: false, message: 'Email registration is currently disabled.' });
        return;
      }

      const data = RegisterSchema.parse(req.body);
      const displayName = data.displayName || data.name || 'Citizen';

      const passCheck = PasswordUtil.validate(data.password);
      if (!passCheck.valid) {
        res.status(400).json({ success: false, message: passCheck.reason });
        return;
      }

      let normalizedEmail: string;
      try {
        normalizedEmail = EmailUtil.normalize(data.email);
      } catch {
        res.status(400).json({ success: false, message: 'Invalid email address format.' });
        return;
      }

      if (EmailUtil.isDisposable(normalizedEmail)) {
        res.status(400).json({ success: false, message: 'Disposable or temporary email domains are not allowed.' });
        return;
      }

      const emailHash = EmailUtil.hash(normalizedEmail, config.emailHashSecret);
      const existingUser = await User.findOne({
        $or: [{ emailHash }, { email: normalizedEmail }],
      });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const passwordHash = await PasswordUtil.hash(data.password);
      const emailEnc = EmailUtil.encrypt(normalizedEmail, config.phoneEncryptionKey);

      let phoneHash: string | undefined;
      let phoneEnc: string | undefined;
      let phoneMasked: string | undefined;
      if (data.phone) {
        try {
          const normPhone = OtpService.normalizePhone(data.phone);
          phoneHash = OtpService.hashPhone(normPhone);
          phoneEnc = OtpService.encryptPhone(normPhone);
          phoneMasked = OtpService.maskPhone(normPhone);
        } catch {}
      }

      const user = await User.create({
        name: displayName,
        displayName,
        email: normalizedEmail,
        emailHash,
        emailEnc,
        passwordHash,
        emailVerified: false,
        emailVerifiedAt: null,
        verifiedMethods: [],
        needsPasswordChange: false,
        language: data.language || 'en',
        role: 'citizen',
        status: 'active',
        phoneHash,
        phoneEnc,
        phoneMasked,
        isProfileComplete: false,
        tokenVersion: 0,
      });

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'register',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { method: 'email_password' },
      });

      const session = await SessionService.createSession(user, Boolean(data.isPublicComputer), req);
      SessionService.setRefreshCookie(res, session.rawRefreshToken, session.maxAgeMs);

      res.status(201).json({
        success: true,
        token: session.accessToken,
        user: sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Email+password login with constant-time dummy comparison and brute-force lockout.
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = LoginSchema.parse(req.body);
      const clientIp = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');

      let normalizedEmail: string;
      try {
        normalizedEmail = EmailUtil.normalize(data.email);
      } catch {
        await PasswordUtil.dummyCompare(data.password);
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const emailHash = EmailUtil.hash(normalizedEmail, config.emailHashSecret);

      const lockout = checkLoginLockout(emailHash, clientIp);
      if (lockout.locked) {
        res.status(429).json({
          success: false,
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
          retryAfter: lockout.retryAfterSec,
        });
        return;
      }

      const user = await User.findOne({
        $or: [{ emailHash }, { email: normalizedEmail }],
      });

      if (!user || !user.passwordHash) {
        await PasswordUtil.dummyCompare(data.password);
        recordFailedLogin(emailHash, clientIp);
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await PasswordUtil.compare(data.password, user.passwordHash);
      if (!isMatch) {
        recordFailedLogin(emailHash, clientIp);
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      clearFailedLogin(emailHash);

      if (user.status === 'deleted') {
        res.status(401).json({ success: false, message: 'This account has been deleted.' });
        return;
      }
      if (user.status === 'suspended') {
        res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
        return;
      }

      const isOfficialOrAgency = user.role === 'official' || user.role === 'agency';
      const skipSecondFactor = config.devSkipOfficialSecondFactor && isOfficialOrAgency;

      if (!skipSecondFactor && user.twoFactorEnabled && user.twoFactorSecret) {
        const tempToken = jwt.sign(
          { userId: user._id.toString(), purpose: '2fa', isPublicComputer: Boolean(data.isPublicComputer) },
          config.jwtSecret,
          { expiresIn: '5m' }
        );
        res.json({
          success: true,
          require2Fa: true,
          tempToken,
          message: 'Two-factor authentication code required.',
        });
        return;
      }

      user.lastLoginAt = new Date();
      await user.save();

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'login',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { method: 'email_password' },
      });

      const session = await SessionService.createSession(user, Boolean(data.isPublicComputer), req);
      SessionService.setRefreshCookie(res, session.rawRefreshToken, session.maxAgeMs);

      res.json({
        success: true,
        token: session.accessToken,
        user: sanitizeUser(user),
        needsPasswordChange: Boolean(user.needsPasswordChange),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Passwordless citizen OTP request.
   */
  static async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = RequestOtpSchema.parse(req.body);

      let normalizedPhone: string;
      try {
        normalizedPhone = OtpService.normalizePhone(data.phone);
      } catch (phoneErr: any) {
        res.status(400).json({ success: false, message: phoneErr.message });
        return;
      }

      const isHuman = await OtpService.verifyBotProtection(data.turnstileToken, req.ip);
      if (!isHuman) {
        res.status(403).json({
          success: false,
          message: 'Bot verification failed. Please complete the security check and try again.',
        });
        return;
      }

      const clientIp = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');
      const result = await OtpService.requestOtp(normalizedPhone, clientIp, data.purpose);

      if (!result.success) {
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter.toString());
        }
        res.status(429).json({
          success: false,
          message: result.message,
          retryAfter: result.retryAfter,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Passwordless citizen OTP verification.
   * Auto-registers new citizens with status 'active' and role 'citizen'.
   * Issues 15m access token and rotating refresh cookie.
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = VerifyOtpSchema.parse(req.body);

      let normalizedPhone: string;
      try {
        normalizedPhone = OtpService.normalizePhone(data.phone);
      } catch (phoneErr: any) {
        res.status(400).json({ success: false, message: phoneErr.message });
        return;
      }

      const verification = await OtpService.verifyOtp(normalizedPhone, data.otp);
      if (!verification.valid) {
        res.status(400).json({
          success: false,
          message: verification.reason || 'Invalid or expired OTP code.',
        });
        return;
      }

      const phoneHash = OtpService.hashPhone(normalizedPhone);
      const phoneEnc = OtpService.encryptPhone(normalizedPhone);
      const phoneMasked = OtpService.maskPhone(normalizedPhone);

      let user = await User.findOne({ phoneHash });
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        const lastDigits = normalizedPhone.slice(-4);
        user = await User.create({
          displayName: `Citizen ${lastDigits}`,
          name: `Citizen ${lastDigits}`,
          phoneHash,
          phoneEnc,
          phoneMasked,
          language: data.language || 'mr',
          role: 'citizen',
          status: 'active',
          tokenVersion: 0,
          isProfileComplete: false,
          lastLoginAt: new Date(),
        });
      } else {
        user.lastLoginAt = new Date();
        if (!user.phoneEnc) {
          user.phoneEnc = phoneEnc;
        }
        await user.save();
      }

      const session = await SessionService.createSession(user, Boolean(data.isPublicComputer), req);
      SessionService.setRefreshCookie(res, session.rawRefreshToken, session.maxAgeMs);

      res.json({
        success: true,
        token: session.accessToken,
        isNewUser,
        isProfileComplete: Boolean(user.isProfileComplete),
        user: sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Official / Agency Claim Registration.
   */
  static async claimOffice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = ClaimOfficeSchema.parse(req.body);
      const normalizedEmail = data.email.toLowerCase().trim();

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
        return;
      }

      const office = await Office.findById(data.officeId);
      if (!office) {
        res.status(400).json({ success: false, message: 'Designated public office not found.' });
        return;
      }

      let normalizedPhone: string;
      try {
        normalizedPhone = OtpService.normalizePhone(data.phone);
      } catch (phoneErr: any) {
        res.status(400).json({ success: false, message: phoneErr.message });
        return;
      }

      const verification = await OtpService.verifyOtp(normalizedPhone, data.otp);
      if (!verification.valid) {
        res.status(400).json({
          success: false,
          message: verification.reason || 'Invalid or expired phone verification code.',
        });
        return;
      }

      const phoneHash = OtpService.hashPhone(normalizedPhone);
      const phoneEnc = OtpService.encryptPhone(normalizedPhone);
      const phoneMasked = OtpService.maskPhone(normalizedPhone);

      let docUrl: string | undefined;
      let docFilename: string | undefined;
      const file = req.file;
      if (file) {
        try {
          const doc = await StorageService.saveDocument(file.buffer, file.originalname, file.mimetype);
          docUrl = doc.url;
          docFilename = doc.filename;
        } catch (fileErr: any) {
          res.status(400).json({ success: false, message: fileErr.message });
          return;
        }
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const memberRole = data.role === 'agency' ? 'contractor' : 'officer';

      const user = await User.create({
        name: data.name,
        displayName: data.name,
        email: normalizedEmail,
        passwordHash,
        phoneHash,
        phoneEnc,
        phoneMasked,
        role: data.role,
        status: 'pending',
        isOfficialVerified: false,
        designation: data.designation,
        employeeId: data.employeeId,
        claimNotes: data.claimNotes,
        officialOfficeId: office._id,
        officeMemberships: [
          {
            officeId: office._id,
            memberRole,
            status: 'pending',
          },
        ],
        isProfileComplete: true,
        lastLoginAt: new Date(),
      });

      const claim = await OfficeClaim.create({
        userId: user._id,
        officeId: office._id,
        role: data.role,
        designation: data.designation,
        employeeId: data.employeeId,
        workEmail: normalizedEmail,
        documentUrl: docUrl,
        documentFilename: docFilename,
        claimNotes: data.claimNotes,
        status: 'pending',
      });

      if (office.claimStatus === 'unclaimed') {
        office.claimStatus = 'pending_verification';
        await office.save();
      }

      const session = await SessionService.createSession(user, Boolean(data.isPublicComputer), req);
      SessionService.setRefreshCookie(res, session.rawRefreshToken, session.maxAgeMs);

      res.status(201).json({
        success: true,
        message:
          'Office verification claim submitted successfully. An administrator will review your credentials before official access is granted.',
        user: sanitizeUser(user),
        token: session.accessToken,
        claimId: claim._id,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Accept an invitation from an office head.
   */
  static async acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = AcceptInviteSchema.parse(req.body);

      const invite = await OfficeInvite.findOne({ token: data.token, used: false });
      if (!invite || invite.expiresAt < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired invitation link. Please request a new invite from your office head.',
        });
        return;
      }

      let normalizedPhone: string;
      try {
        normalizedPhone = OtpService.normalizePhone(data.phone);
      } catch (phoneErr: any) {
        res.status(400).json({ success: false, message: phoneErr.message });
        return;
      }

      const verification = await OtpService.verifyOtp(normalizedPhone, data.otp);
      if (!verification.valid) {
        res.status(400).json({
          success: false,
          message: verification.reason || 'Invalid or expired phone verification code.',
        });
        return;
      }

      const phoneHash = OtpService.hashPhone(normalizedPhone);
      const phoneEnc = OtpService.encryptPhone(normalizedPhone);
      const phoneMasked = OtpService.maskPhone(normalizedPhone);

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await User.create({
        name: data.name,
        displayName: data.name,
        email: invite.email,
        passwordHash,
        phoneHash,
        phoneEnc,
        phoneMasked,
        role: invite.role,
        status: 'active',
        isOfficialVerified: true,
        officialOfficeId: invite.officeId,
        officeMemberships: [
          {
            officeId: invite.officeId,
            memberRole: invite.memberRole,
            status: 'active',
          },
        ],
        isProfileComplete: true,
        lastLoginAt: new Date(),
      });

      invite.used = true;
      invite.usedAt = new Date();
      invite.usedBy = user._id;
      await invite.save();

      const session = await SessionService.createSession(user, Boolean(data.isPublicComputer), req);
      SessionService.setRefreshCookie(res, session.rawRefreshToken, session.maxAgeMs);

      res.status(201).json({
        success: true,
        message: 'Invitation accepted! Your verified account is active.',
        token: session.accessToken,
        user: sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Rotate session refresh token and issue new 15-minute access token.
   * Enforces token reuse detection, invalidating entire token family if reused.
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[SessionService.COOKIE_NAME];
      if (!rawRefreshToken) {
        res.status(401).json({ success: false, message: 'No active session found.' });
        return;
      }

      const result = await SessionService.rotateSession(rawRefreshToken, req);
      if (!result.success) {
        SessionService.clearRefreshCookie(res);
        const errorMsg =
          result.reason === 'reuse_detected'
            ? 'Security Alert: Stale session token reused. All sessions have been terminated. Please log in again.'
            : result.reason === 'user_suspended'
            ? 'Account has been suspended.'
            : 'Session expired or invalid. Please sign in again.';
        res.status(401).json({ success: false, message: errorMsg });
        return;
      }

      SessionService.setRefreshCookie(res, result.newRawRefreshToken, result.maxAgeMs);

      res.json({
        success: true,
        token: result.accessToken,
        user: sanitizeUser(result.user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log out of current device session (revokes refresh token and clears cookie).
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[SessionService.COOKIE_NAME];
      if (rawRefreshToken) {
        await SessionService.revokeSession(rawRefreshToken);
      }
      SessionService.clearRefreshCookie(res);
      res.json({ success: true, message: 'Successfully logged out.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Global sign-out: increments user.tokenVersion and revokes all refresh tokens across all devices.
   */
  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      await SessionService.revokeAllUserSessions(req.user.userId);
      SessionService.clearRefreshCookie(res);

      res.json({ success: true, message: 'All active sessions have been terminated across all devices.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Initialize TOTP 2FA setup (RFC 6238).
   */
  static async setup2Fa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const secret = generateTotpSecret();
      const { plainCodes, hashedCodes } = generateBackupCodes(8);

      user.twoFactorTempSecret = secret;
      user.twoFactorBackupCodes = hashedCodes;
      await user.save();

      const otpAuthUri = generateTotpUri(secret, user.email || user.displayName);

      res.json({
        success: true,
        secret,
        otpAuthUri,
        backupCodes: plainCodes,
        message: 'Scan the QR code or enter the secret in your authenticator app.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify and confirm TOTP 2FA setup.
   */
  static async verify2FaSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { token } = Verify2FaSetupSchema.parse(req.body);
      const user = await User.findById(req.user.userId);

      if (!user || !user.twoFactorTempSecret) {
        res.status(400).json({ success: false, message: 'No 2FA setup in progress.' });
        return;
      }

      const isValid = verifyTotp(token, user.twoFactorTempSecret);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'Invalid 6-digit verification code.' });
        return;
      }

      user.twoFactorSecret = user.twoFactorTempSecret;
      user.twoFactorTempSecret = undefined;
      user.twoFactorEnabled = true;
      await user.save();

      res.json({
        success: true,
        message: 'Two-factor authentication successfully enabled on your account.',
        twoFactorEnabled: true,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify TOTP code or backup code during login challenge.
   * Issues 15m access token and rotating refresh cookie.
   */
  static async verify2FaLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tempToken, code, isPublicComputer } = Verify2FaLoginSchema.parse(req.body);

      let payload: any;
      try {
        payload = jwt.verify(tempToken, config.jwtSecret);
      } catch {
        res.status(401).json({ success: false, message: '2FA session expired. Please sign in again.' });
        return;
      }

      if (payload.purpose !== '2fa' || !payload.userId) {
        res.status(401).json({ success: false, message: 'Invalid 2FA challenge token.' });
        return;
      }

      const user = await User.findById(payload.userId);
      if (!user || !user.twoFactorSecret) {
        res.status(400).json({ success: false, message: 'User account 2FA is not configured.' });
        return;
      }

      const cleanCode = code.trim().toUpperCase();
      let authenticated = false;

      if (/^\d{6}$/.test(cleanCode)) {
        authenticated = verifyTotp(cleanCode, user.twoFactorSecret);
      }

      if (!authenticated && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const backupCheck = verifyAndConsumeBackupCode(cleanCode, user.twoFactorBackupCodes);
        if (backupCheck.valid && backupCheck.matchingIndex !== undefined) {
          authenticated = true;
          user.twoFactorBackupCodes.splice(backupCheck.matchingIndex, 1);
          await user.save();
        }
      }

      if (!authenticated) {
        res.status(400).json({
          success: false,
          message: 'Invalid two-factor code or backup code.',
        });
        return;
      }

      user.lastLoginAt = new Date();
      await user.save();

      const session = await SessionService.createSession(
        user,
        isPublicComputer !== undefined ? isPublicComputer : Boolean(payload.isPublicComputer),
        req
      );
      SessionService.setRefreshCookie(res, session.rawRefreshToken, session.maxAgeMs);

      res.json({
        success: true,
        token: session.accessToken,
        user: sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Disable 2FA with password confirmation.
   */
  static async disable2Fa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { password } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user || !user.passwordHash) {
        res.status(400).json({ success: false, message: 'User not found.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Incorrect password.' });
        return;
      }

      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.twoFactorBackupCodes = [];
      await user.save();

      res.json({
        success: true,
        message: 'Two-factor authentication disabled.',
        twoFactorEnabled: false,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current authenticated user profile.
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }
      const user = await User.findById(req.user.userId).populate('officialOfficeId');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({
        success: true,
        user: sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Complete / update citizen profile.
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const data = UpdateProfileSchema.parse(req.body);
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (data.displayName) {
        user.displayName = data.displayName.trim();
        user.name = data.displayName.trim();
      }

      if (data.homeWard) {
        user.homeWard = data.homeWard.trim();
        if (!user.homeArea) user.homeArea = {};
        user.homeArea.ward = data.homeWard.trim();
      }

      if (data.language) {
        user.language = data.language;
      }

      if (data.consent) {
        if (data.consent.consented) {
          user.consentVersion = data.consent.consentVersion;
          user.consentAt = new Date();
        }
      }

      if (
        user.displayName &&
        user.displayName.length >= 2 &&
        (user.homeWard || user.homeArea?.ward) &&
        user.consentAt
      ) {
        user.isProfileComplete = true;
      }

      await user.save();

      res.json({
        success: true,
        isProfileComplete: Boolean(user.isProfileComplete),
        user: sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request password reset link (Turnstile bot protected, rate limited).
   * Generates URL-safe token, stores SHA-256 hash in PasswordResetToken with TTL.
   * Dispatches link via EmailProvider (console in dev, SMTP in prod).
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = ForgotPasswordSchema.parse(req.body);
      const clientIp = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');

      let normalizedEmail = '';
      try {
        normalizedEmail = EmailUtil.normalize(data.email);
      } catch {
        normalizedEmail = data.email.trim().toLowerCase();
      }

      const emailHash = EmailUtil.hash(normalizedEmail, config.emailHashSecret);

      const allowed = checkForgotPasswordRateLimit(emailHash, clientIp);
      if (!allowed) {
        res.status(429).json({
          success: false,
          message: 'Too many password reset requests. Please wait before trying again.',
        });
        return;
      }

      const user = await User.findOne({
        $or: [{ emailHash }, { email: normalizedEmail }],
      });

      // Token is created only for an existing account with a password, excluding admins
      if (user && user.passwordHash && user.role !== 'admin' && user.status !== 'deleted') {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });

        const expiresAt = new Date(Date.now() + config.passwordResetTtlMinutes * 60 * 1000);
        await PasswordResetToken.create({
          userId: user._id,
          tokenHash,
          expiresAt,
          usedAt: null,
          ip: clientIp,
          userAgent: req.headers['user-agent'],
        });

        await AuditService.log({
          actorId: user._id,
          actorRole: user.role,
          action: 'forgot_password_request',
          targetType: 'user',
          targetId: user._id,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });

        await EmailService.sendPasswordResetEmail(normalizedEmail, rawToken, user.language);
      } else {
        await PasswordUtil.dummyCompare('dummy_constant_time_comparison');
      }

      res.json({
        success: true,
        message: 'If an account exists, a reset link has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Complete password reset using single-use hashed token.
   * Revokes all sessions, sets emailVerified=true, sends password changed email.
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = ResetPasswordSchema.parse(req.body);

      const passCheck = PasswordUtil.validate(data.newPassword);
      if (!passCheck.valid) {
        res.status(400).json({ success: false, message: passCheck.reason });
        return;
      }

      const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
      const resetRecord = await PasswordResetToken.findOne({ tokenHash });

      if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset link. Please request a new one.',
        });
        return;
      }

      const user = await User.findById(resetRecord.userId);
      if (!user || user.role === 'admin' || user.status === 'deleted') {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset link. Please request a new one.',
        });
        return;
      }

      user.passwordHash = await PasswordUtil.hash(data.newPassword);
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
      user.needsPasswordChange = false;
      if (!user.verifiedMethods) user.verifiedMethods = [];
      if (!user.verifiedMethods.includes('email')) user.verifiedMethods.push('email');
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      resetRecord.usedAt = new Date();
      await resetRecord.save();

      await SessionService.revokeAllUserSessions(user._id.toString());

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'reset_password_completed',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (user.email) {
        await EmailService.sendPasswordChangedEmail(user.email, user.language).catch(() => {});
      }

      res.json({
        success: true,
        message: 'Your password has been successfully reset. Please sign in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticated user change password. Invalidates other sessions.
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const data = ChangePasswordSchema.parse(req.body);
      const user = await User.findById(req.user.userId);
      if (!user || !user.passwordHash) {
        res.status(400).json({ success: false, message: 'No password set on this account.' });
        return;
      }

      const isCurrentMatch = await PasswordUtil.compare(data.currentPassword, user.passwordHash);
      if (!isCurrentMatch) {
        res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }

      const passCheck = PasswordUtil.validate(data.newPassword);
      if (!passCheck.valid) {
        res.status(400).json({ success: false, message: passCheck.reason });
        return;
      }

      user.passwordHash = await PasswordUtil.hash(data.newPassword);
      user.needsPasswordChange = false;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      await SessionService.revokeAllUserSessions(user._id.toString());

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'change_password',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const session = await SessionService.createSession(user, false, req);
      SessionService.setRefreshCookie(res, session.rawRefreshToken, session.maxAgeMs);

      res.json({
        success: true,
        token: session.accessToken,
        message: 'Password changed successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticated citizen adds a phone number verified by OTP.
   */
  static async addPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const data = AddPhoneSchema.parse(req.body);
      const otpRes = await OtpService.verifyOtp(data.phone, data.otp, 'auth');
      if (!otpRes.valid) {
        res.status(400).json({ success: false, message: otpRes.reason || 'Invalid OTP code' });
        return;
      }

      const normPhone = OtpService.normalizePhone(data.phone);
      const phoneHash = OtpService.hashPhone(normPhone);

      const existing = await User.findOne({ phoneHash, _id: { $ne: req.user.userId } });
      if (existing) {
        res.status(409).json({ success: false, message: 'This phone number is already attached to another account.' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.phoneEnc = OtpService.encryptPhone(normPhone);
      user.phoneHash = phoneHash;
      user.phoneMasked = OtpService.maskPhone(normPhone);
      if (!user.verifiedMethods) user.verifiedMethods = [];
      if (!user.verifiedMethods.includes('phone')) user.verifiedMethods.push('phone');
      await user.save();

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'add_phone_verified',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Phone number verified and attached successfully.',
        user: sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Self-serve account deletion (DPDP Act 2023).
   * Verifies password (admin/legacy/email) or fresh phone OTP with purpose='delete_account' (phone citizens).
   * Wipes all PII, nullifies memberships, increments tokenVersion, revokes all sessions,
   * retains filed issues (anonymized to "Deleted user") and supports given (removes reference, preserves count).
   */
  static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const data = DeleteAccountSchema.parse(req.body);
      const user = await User.findById(req.user.userId);
      if (!user || user.status === 'deleted') {
        res.status(404).json({ success: false, message: 'User not found or already deleted.' });
        return;
      }

      // If user has a password set (admin / email accounts)
      if (user.passwordHash) {
        if (!data.password) {
          res.status(400).json({ success: false, message: 'Current password is required to delete this account.' });
          return;
        }
        const isValid = await PasswordUtil.compare(data.password, user.passwordHash);
        if (!isValid) {
          res.status(401).json({ success: false, message: 'Invalid password.' });
          return;
        }
      } else {
        // Citizen passwordless account: require fresh phone OTP with purpose='delete_account'
        if (!user.phoneEnc) {
          res.status(400).json({ success: false, message: 'No phone verification record found for this account.' });
          return;
        }
        if (!data.otp) {
          res.status(400).json({ success: false, message: 'Verification code is required to delete your account.' });
          return;
        }

        const rawPhone = OtpService.decryptPhone(user.phoneEnc);
        const otpResult = await OtpService.verifyOtp(rawPhone, data.otp, 'delete_account');
        if (!otpResult.valid) {
          res.status(400).json({ success: false, message: otpResult.reason || 'Invalid verification code.' });
          return;
        }
      }

      // 1. Wipe PII and set status: 'deleted'
      user.phoneEnc = undefined;
      user.phoneHash = undefined;
      user.phoneMasked = undefined;
      user.email = undefined;
      user.emailHash = undefined;
      user.emailEnc = undefined;
      user.passwordHash = undefined;
      user.emailVerified = false;
      user.emailVerifiedAt = null;
      user.verifiedMethods = [];
      user.twoFactorSecret = undefined;
      user.twoFactorTempSecret = undefined;
      user.twoFactorBackupCodes = [];
      user.displayName = 'Deleted user';
      user.name = 'Deleted user';
      user.status = 'deleted';
      user.isActive = false;
      user.officeMemberships = [];
      user.officialOfficeId = undefined;
      user.isOfficialVerified = false;
      user.tokenVersion += 1;
      await user.save();

      // 2. Retain issues filed (anonymized to "Deleted user") and supports given (remove reference, preserve count)
      const { Raise } = await import('../../models/Raise.js');
      await Raise.deleteMany({ userId: user._id });

      // 3. Invalidate all active sessions & clear cookie
      await SessionService.revokeAllUserSessions(user._id.toString());
      SessionService.clearRefreshCookie(res);

      // 4. Structured audit log
      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'delete_account',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Your account and personal data have been permanently deleted.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DPDP Act 2023 - Section 11 Right to Information & Portability
   * Exports a full, machine-readable JSON dump of the citizen's personal data.
   */
  static async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }
      const user = await User.findById(req.user.userId);
      if (!user || user.status === 'deleted') {
        res.status(404).json({ success: false, message: 'User not found or account is deleted.' });
        return;
      }

      let plainEmail: string | undefined = undefined;
      if (user.emailEnc) {
        try {
          plainEmail = EmailUtil.decrypt(user.emailEnc, config.emailEncryptionKey);
        } catch {
          plainEmail = user.email;
        }
      } else if (user.email) {
        plainEmail = user.email;
      }

      let plainPhone: string | undefined = undefined;
      if (user.phoneEnc) {
        try {
          plainPhone = OtpService.decryptPhone(user.phoneEnc);
        } catch {
          plainPhone = user.phoneMasked;
        }
      }

      const { Issue } = await import('../../models/Issue.js');
      const { Raise } = await import('../../models/Raise.js');
      const { Notification } = await import('../../models/Notification.js');
      const { NotificationPreference } = await import('../../models/NotificationPreference.js');
      const { AuditLog } = await import('../../models/AuditLog.js');

      const [userIssues, userRaises, userNotifications, notificationPreferences, userAuditTrail] = await Promise.all([
        Issue.find({ authorId: user._id }).select('-__v').lean(),
        Raise.find({ userId: user._id }).populate('issueId', 'title category status location address').lean(),
        Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100).lean(),
        NotificationPreference.findOne({ userId: user._id }).lean(),
        AuditLog.find({ actorId: user._id }).sort({ createdAt: -1 }).limit(100).lean(),
      ]);

      await AuditService.log({
        actorId: user._id,
        actorRole: user.role,
        action: 'export_data',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="raise-citizen-data-${user._id}.json"`);
      res.status(200).json({
        success: true,
        dpdpCompliance: {
          act: 'Digital Personal Data Protection Act 2023 (DPDP Act)',
          section: 'Section 11 (Right to Access and Portability of Personal Data)',
          purpose: 'Citizen Data Portability Export',
          generatedAt: new Date().toISOString(),
        },
        data: {
          profile: {
            id: user._id,
            name: user.name,
            displayName: user.displayName,
            email: plainEmail,
            emailVerified: Boolean(user.emailVerified),
            phone: plainPhone,
            phoneMasked: user.phoneMasked,
            language: user.language,
            role: user.role,
            status: user.status,
            homeWard: user.homeWard || user.homeArea?.ward,
            homeArea: user.homeArea,
            isProfileComplete: Boolean(user.isProfileComplete),
            verifiedMethods: user.verifiedMethods || [],
            consentVersion: user.consentVersion,
            consentAt: user.consentAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          issuesFilingHistory: userIssues,
          raisesAndSupports: userRaises,
          notifications: userNotifications,
          notificationPreferences: notificationPreferences || null,
          auditTrail: userAuditTrail,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

