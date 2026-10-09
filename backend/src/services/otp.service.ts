import crypto from 'crypto';
import { config } from '../config/env.js';
import {
  normalizeIndianPhone,
  maskPhone,
  hashPhone,
  encryptPhone,
  decryptPhone,
  hashOtp,
} from '../utils/crypto.util.js';
import { SmsProvider } from './sms/sms.interface.js';
import { ConsoleSmsProvider } from './sms/console.provider.js';
import { Msg91SmsProvider } from './sms/msg91.provider.js';
import { WhatsAppOtpProvider } from './sms/whatsapp.provider.js';

interface OtpRecord {
  otpHash: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

// In-memory rate limiting and OTP store (backed by clean adapter pattern)
const otpStore = new Map<string, OtpRecord>();
const phoneRateLimits = new Map<string, RateLimitTracker>();
const ipRateLimits = new Map<string, RateLimitTracker>();

let dailySmsCount = 0;
let dailySmsResetAt = Date.now() + 24 * 60 * 60 * 1000;

export class OtpService {
  private static provider: SmsProvider | null = null;

  public static getProvider(): SmsProvider {
    if (!this.provider) {
      if (config.otpProvider === 'msg91') {
        this.provider = new Msg91SmsProvider();
      } else if (config.otpProvider === 'whatsapp') {
        this.provider = new WhatsAppOtpProvider();
      } else {
        this.provider = new ConsoleSmsProvider();
      }
    }
    return this.provider;
  }

  public static setProvider(customProvider: SmsProvider) {
    this.provider = customProvider;
  }

  /**
   * Resets internal store (useful for tests)
   */
  public static clearStoreForTesting() {
    otpStore.clear();
    phoneRateLimits.clear();
    ipRateLimits.clear();
    dailySmsCount = 0;
  }

  /**
   * Validates bot protection (Cloudflare Turnstile) if configured.
   */
  public static async verifyBotProtection(token?: string, remoteIp?: string): Promise<boolean> {
    if (!config.turnstileSecret) {
      return true; // Skip when secret is not configured
    }

    if (!token) {
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', config.turnstileSecret);
      formData.append('response', token);
      if (remoteIp) formData.append('remoteip', remoteIp);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      const data = (await res.json()) as any;
      return Boolean(data.success);
    } catch (err) {
      console.error('[BotProtection] Verification error:', err);
      return false;
    }
  }

  /**
   * Rate limiting verification
   */
  public static checkRateLimits(
    normalizedPhone: string,
    clientIp: string,
    purpose: string = 'auth'
  ): { allowed: boolean; retryAfter?: number; reason?: string } {
    const now = Date.now();

    // 1. Global Daily SMS Cap
    if (now > dailySmsResetAt) {
      dailySmsCount = 0;
      dailySmsResetAt = now + 24 * 60 * 60 * 1000;
    }
    if (dailySmsCount >= config.otpDailyCap) {
      return {
        allowed: false,
        retryAfter: Math.ceil((dailySmsResetAt - now) / 1000),
        reason: 'Daily platform SMS limit reached. Please try again tomorrow.',
      };
    }

    // 2. 60-Second Resend Cooldown per phone & purpose
    const storeKey = `${purpose}:${normalizedPhone}`;
    const existingOtp = otpStore.get(storeKey);
    if (existingOtp && now - existingOtp.createdAt < 60000) {
      const retryAfter = Math.ceil((60000 - (now - existingOtp.createdAt)) / 1000);
      return {
        allowed: false,
        retryAfter,
        reason: `Please wait ${retryAfter} seconds before requesting a new OTP.`,
      };
    }

    // 3. Hourly limit per phone (max 5/hour)
    const phoneLimit = phoneRateLimits.get(normalizedPhone);
    if (phoneLimit) {
      if (now > phoneLimit.resetAt) {
        phoneRateLimits.set(normalizedPhone, { count: 1, resetAt: now + 3600000 });
      } else if (phoneLimit.count >= 5) {
        return {
          allowed: false,
          retryAfter: Math.ceil((phoneLimit.resetAt - now) / 1000),
          reason: 'Too many OTP requests for this phone number. Please try again later.',
        };
      }
    }

    // 4. Hourly limit per IP (max 20/hour)
    const ipLimit = ipRateLimits.get(clientIp);
    if (ipLimit) {
      if (now > ipLimit.resetAt) {
        ipRateLimits.set(clientIp, { count: 1, resetAt: now + 3600000 });
      } else if (ipLimit.count >= 20) {
        return {
          allowed: false,
          retryAfter: Math.ceil((ipLimit.resetAt - now) / 1000),
          reason: 'Too many requests from this IP address. Please try again later.',
        };
      }
    }

    return { allowed: true };
  }

  private static recordRateLimitUsage(normalizedPhone: string, clientIp: string) {
    const now = Date.now();

    // Increment global count
    dailySmsCount++;

    // Increment phone tracker
    const pLimit = phoneRateLimits.get(normalizedPhone);
    if (!pLimit || now > pLimit.resetAt) {
      phoneRateLimits.set(normalizedPhone, { count: 1, resetAt: now + 3600000 });
    } else {
      pLimit.count++;
    }

    // Increment IP tracker
    const iLimit = ipRateLimits.get(clientIp);
    if (!iLimit || now > iLimit.resetAt) {
      ipRateLimits.set(clientIp, { count: 1, resetAt: now + 3600000 });
    } else {
      iLimit.count++;
    }
  }

  /**
   * Generates a 6-digit OTP, hashes it, stores it, and delivers via SmsProvider.
   */
  public static async requestOtp(
    rawPhone: string,
    clientIp: string = '127.0.0.1',
    purpose: string = 'auth'
  ): Promise<{ success: boolean; message: string; retryAfter?: number }> {
    const normalizedPhone = normalizeIndianPhone(rawPhone);

    const rateCheck = this.checkRateLimits(normalizedPhone, clientIp, purpose);
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: rateCheck.reason || 'Rate limit exceeded.',
        retryAfter: rateCheck.retryAfter,
      };
    }

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(normalizedPhone, rawOtp, config.otpHashSecret);
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    const storeKey = `${purpose}:${normalizedPhone}`;

    // Store hash; invalidates any previous OTP for this phone & purpose
    otpStore.set(storeKey, {
      otpHash,
      createdAt: now,
      expiresAt,
      attempts: 0,
    });

    this.recordRateLimitUsage(normalizedPhone, clientIp);

    // Send via provider
    const provider = this.getProvider();
    await provider.sendOtp(normalizedPhone, rawOtp);

    return {
      success: true,
      message: 'If this mobile number is valid, an OTP has been sent.',
    };
  }

  /**
   * Verifies submitted OTP against stored hash with attempt lockout.
   */
  public static async verifyOtp(
    rawPhone: string,
    inputOtp: string,
    purpose: string = 'auth'
  ): Promise<{ valid: boolean; reason?: string }> {
    const normalizedPhone = normalizeIndianPhone(rawPhone);
    const storeKey = `${purpose}:${normalizedPhone}`;
    const record = otpStore.get(storeKey);

    // Development fixed code check (only in non-production)
    if (config.nodeEnv !== 'production' && config.otpDevFixedCode) {
      if (inputOtp === config.otpDevFixedCode) {
        otpStore.delete(storeKey);
        return { valid: true };
      }
    }

    if (!record) {
      return { valid: false, reason: 'OTP has expired or was not requested. Please request a new code.' };
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      otpStore.delete(storeKey);
      return { valid: false, reason: 'OTP has expired. Please request a new code.' };
    }

    // Check attempt lockout
    if (record.attempts >= 5) {
      otpStore.delete(storeKey);
      return { valid: false, reason: 'Maximum attempts exceeded. This OTP is now invalid. Please request a new one.' };
    }

    const inputHash = hashOtp(normalizedPhone, inputOtp.trim(), config.otpHashSecret);

    if (crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(record.otpHash, 'hex'))) {
      // Single-use: delete immediately on success
      otpStore.delete(storeKey);
      return { valid: true };
    }

    // Increment attempts on failure
    record.attempts += 1;
    if (record.attempts >= 5) {
      otpStore.delete(storeKey);
      return {
        valid: false,
        reason: 'Incorrect code. Maximum attempts reached. Please request a new code.',
      };
    }

    return {
      valid: false,
      reason: `Incorrect code. ${5 - record.attempts} attempts remaining.`,
    };
  }

  // Export helpers for controllers
  public static normalizePhone(phone: string): string {
    return normalizeIndianPhone(phone);
  }

  public static maskPhone(phone: string): string {
    return maskPhone(phone);
  }

  public static hashPhone(phone: string): string {
    return hashPhone(phone, config.phoneHashSecret);
  }

  public static encryptPhone(phone: string): string {
    return encryptPhone(phone, config.phoneEncryptionKey);
  }

  public static decryptPhone(payload: string): string {
    return decryptPhone(payload, config.phoneEncryptionKey);
  }
}
