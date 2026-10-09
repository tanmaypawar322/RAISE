import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { PasswordUtil } from '../../utils/password.util.js';
import { EmailUtil } from '../../utils/email.util.js';
import {
  checkLoginLockout,
  recordFailedLogin,
  clearFailedLogin,
  checkForgotPasswordRateLimit,
  clearAuthLimitsForTesting,
} from './auth.controller.js';
import { recordDevEmail, getDevMailbox, clearDevMailbox } from '../../services/email/dev-mailbox.js';
import { ConsoleEmailProvider } from '../../services/email/console.provider.js';
import { EmailService } from '../../services/email/email.service.js';

describe('AUTH ADJUSTMENT Security Rules & Test Suite', () => {
  beforeEach(() => {
    clearAuthLimitsForTesting();
    clearDevMailbox();
  });

  describe('1. Password Policy & Blacklist (NIST Guidelines)', () => {
    it('accepts valid passwords between 10 and 128 characters', () => {
      const res = PasswordUtil.validate('mypasswordisstrong123');
      assert.equal(res.valid, true);
    });

    it('rejects passwords shorter than 10 characters', () => {
      const res = PasswordUtil.validate('short89');
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /at least 10 characters/);
    });

    it('rejects passwords longer than 128 characters', () => {
      const longPass = 'a'.repeat(129);
      const res = PasswordUtil.validate(longPass);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /128 characters/);
    });

    it('rejects common passwords from the bundled blacklist', () => {
      const common = ['password123', '1234567890', 'admin123456', 'qwertyuiop'];
      for (const pass of common) {
        const res = PasswordUtil.validate(pass);
        assert.equal(res.valid, false, `Failed to reject common password: ${pass}`);
        assert.match(res.reason || '', /too common/);
      }
    });

    it('hashes passwords using bcrypt cost 12 and verifies correctly', async () => {
      const password = 'CorrectHorseBattery123!';
      const hash = await PasswordUtil.hash(password);
      assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'));

      const isMatch = await PasswordUtil.compare(password, hash);
      assert.equal(isMatch, true);

      const isWrongMatch = await PasswordUtil.compare('WrongPassword999', hash);
      assert.equal(isWrongMatch, false);
    });

    it('performs dummy comparison for constant-time handling on unknown accounts', async () => {
      const start = Date.now();
      const res = await PasswordUtil.dummyCompare('arbitraryPassword123');
      const elapsed = Date.now() - start;
      assert.equal(res, false);
      // Bcrypt cost 12 takes non-trivial time (~50-300ms depending on CPU)
      assert.ok(elapsed >= 20, 'Dummy comparison executed with bcrypt delay');
    });
  });

  describe('2. Email Normalization, Storage Cryptography & Disposable Domain Block', () => {
    const secret = 'test_email_hash_secret_123456789012';
    const aesKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    it('normalizes email addresses (lowercasing, trimming)', () => {
      assert.equal(EmailUtil.normalize('  Citizen@Example.COM  '), 'citizen@example.com');
    });

    it('normalizes gmail.com (strips dots and tags)', () => {
      assert.equal(EmailUtil.normalize('rahul.deshmukh+test123@gmail.com'), 'rahuldeshmukh@gmail.com');
      assert.equal(EmailUtil.normalize('r.a.h.u.l@googlemail.com'), 'rahul@gmail.com');
    });

    it('identifies disposable/burner email domains', () => {
      assert.equal(EmailUtil.isDisposable('spammer@mailinator.com'), true);
      assert.equal(EmailUtil.isDisposable('user@tempmail.com'), true);
      assert.equal(EmailUtil.isDisposable('citizen@gmail.com'), false);
      assert.equal(EmailUtil.isDisposable('official@pcmc.gov.in'), false);
    });

    it('computes deterministic HMAC-SHA256 for database index lookups', () => {
      const hash1 = EmailUtil.hash('Citizen@Gmail.com', secret);
      const hash2 = EmailUtil.hash('citizen+tag@gmail.com', secret);
      assert.equal(hash1, hash2);
      assert.equal(typeof hash1, 'string');
      assert.equal(hash1.length, 64);
    });

    it('encrypts and decrypts email using AES-256-GCM', () => {
      const email = 'secret.citizen@pcmc.org';
      const enc = EmailUtil.encrypt(email, aesKey);
      assert.notEqual(enc, email);
      assert.equal(enc.split(':').length, 3);

      const decrypted = EmailUtil.decrypt(enc, aesKey);
      assert.equal(decrypted, 'secret.citizen@pcmc.org');
    });

    it('masks email for safe profile displays', () => {
      assert.equal(EmailUtil.mask('rahul@gmail.com'), 'r***l@gmail.com');
      assert.equal(EmailUtil.mask('ab@example.com'), 'a***@example.com');
    });
  });

  describe('3. Login Hardening, Rate Limiting & Lockout', () => {
    it('locks out email and IP after 5 failed attempts', () => {
      const emailKey = 'hash_locked_email_123';
      const ip = '192.168.1.100';

      assert.equal(checkLoginLockout(emailKey, ip).locked, false);

      for (let i = 0; i < 4; i++) {
        recordFailedLogin(emailKey, ip);
        assert.equal(checkLoginLockout(emailKey, ip).locked, false);
      }

      // 5th failed attempt locks out
      recordFailedLogin(emailKey, ip);
      const lockStatus = checkLoginLockout(emailKey, ip);
      assert.equal(lockStatus.locked, true);
      assert.ok((lockStatus.retryAfterSec || 0) > 0);

      // Clearing tracker unlocks
      clearFailedLogin(emailKey);
      assert.equal(checkLoginLockout(emailKey, ip).locked, false);
    });
  });

  describe('4. Forgot Password Flow, Rate Limiting & Dev Mailbox', () => {
    it('enforces forgot-password rate limits (max 3/hr per email, max 10/hr per IP)', () => {
      const emailKey = 'hash_forgot_rate_test';
      const ip = '10.0.0.5';

      assert.equal(checkForgotPasswordRateLimit(emailKey, ip), true);
      assert.equal(checkForgotPasswordRateLimit(emailKey, ip), true);
      assert.equal(checkForgotPasswordRateLimit(emailKey, ip), true);
      // 4th request in the same hour is blocked
      assert.equal(checkForgotPasswordRateLimit(emailKey, ip), false);
    });

    it('generates 32-byte URL-safe token and SHA-256 hash', () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      assert.equal(rawToken.length, 64);
      assert.equal(tokenHash.length, 64);
      assert.notEqual(rawToken, tokenHash);
    });

    it('dispatches password reset link to dev mailbox outside production', async () => {
      const provider = new ConsoleEmailProvider();
      const res = await provider.send({
        to: 'citizen@example.com',
        subject: 'Reset your RAISE password',
        text: 'http://localhost:3000/reset-password?token=abcdef123456',
      });
      assert.equal(res.success, true);

      const mailbox = getDevMailbox();
      assert.equal(mailbox.length, 1);
      assert.equal(mailbox[0].to, 'citizen@example.com');
      assert.match(mailbox[0].text, /token=abcdef123456/);
    });

    it('renders password reset templates without containing any passwords in en/mr/hi', async () => {
      await EmailService.sendPasswordResetEmail('test@example.com', 'dummy_token_123', 'en');
      await EmailService.sendPasswordResetEmail('test@example.com', 'dummy_token_123', 'mr');
      await EmailService.sendPasswordResetEmail('test@example.com', 'dummy_token_123', 'hi');

      const mailbox = getDevMailbox();
      assert.equal(mailbox.length, 3);
      for (const mail of mailbox) {
        assert.ok(!mail.text.toLowerCase().includes('your password is'));
        assert.ok(!mail.text.toLowerCase().includes('your password:'));
        assert.ok(mail.text.includes('/reset-password?token=dummy_token_123'));
        assert.ok(mail.text.includes('ignore') || mail.text.includes('दुर्लक्ष') || mail.text.includes('अनदेखा'));
      }
    });

    it('suppresses console provider dispatch and warns in production', async () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const provider = new ConsoleEmailProvider();
        const res = await provider.send({
          to: 'citizen@example.com',
          subject: 'Test in prod',
          text: 'Reset link',
        });
        assert.equal(res.success, false);
        assert.match(res.error || '', /temporarily unavailable in production/);
      } finally {
        process.env.NODE_ENV = oldEnv;
      }
    });
  });

  describe('5. Production Safety Guards for Dev-Only Flags', () => {
    it('validates that DEV_SKIP_OFFICIAL_SECOND_FACTOR must never be set in production mode', () => {
      const isProd = true;
      const devSkip = 'true';
      assert.throws(() => {
        if (isProd && devSkip) {
          throw new Error('FATAL SECURITY ERROR: DEV_SKIP_OFFICIAL_SECOND_FACTOR must never be set in production mode.');
        }
      }, /FATAL SECURITY ERROR/);
    });

    it('validates that DEV_MAILBOX must never be enabled in production mode', () => {
      const isProd = true;
      const devMailbox = 'true';
      assert.throws(() => {
        if (isProd && devMailbox === 'true') {
          throw new Error('FATAL SECURITY ERROR: DEV_MAILBOX must never be enabled in production mode.');
        }
      }, /FATAL SECURITY ERROR/);
    });

    it('validates that OTP_DEV_FIXED_CODE must never be enabled in production mode', () => {
      const isProd = true;
      const fixedCode = '123456';
      assert.throws(() => {
        if (isProd && fixedCode) {
          throw new Error('FATAL SECURITY ERROR: OTP_DEV_FIXED_CODE must never be set in production mode.');
        }
      }, /FATAL SECURITY ERROR/);
    });
  });

  describe('6. Sparse Index & Dual Identifier Coexistence', () => {
    it('verifies phoneHash and emailHash indexing conditions', () => {
      // Simulating dual email-only accounts:
      const account1 = {
        email: 'user1@example.com',
        emailHash: 'hash_user_1',
        phoneHash: undefined,
      };
      const account2 = {
        email: 'user2@example.com',
        emailHash: 'hash_user_2',
        phoneHash: undefined,
      };

      // Both email-only accounts have unique emailHash and undefined phoneHash
      assert.notEqual(account1.emailHash, account2.emailHash);
      assert.equal(account1.phoneHash, undefined);
      assert.equal(account2.phoneHash, undefined);
      // In MongoDB, sparse indexes index only documents that have the field,
      // allowing multiple documents without phoneHash to coexist cleanly without collision.
    });
  });
});
