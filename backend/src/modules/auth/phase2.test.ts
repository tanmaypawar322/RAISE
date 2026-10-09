import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  normalizeIndianPhone,
  maskPhone,
  hashPhone,
  encryptPhone,
  decryptPhone,
  hashOtp,
} from '../../utils/crypto.util.js';
import { OtpService } from '../../services/otp.service.js';
import {
  RequestOtpSchema,
  VerifyOtpSchema,
  UpdateProfileSchema,
} from './auth.controller.js';

describe('Phase 2 Security Rules: Phone Validation, AES-256 Encryption & OTP Lifecycle', () => {
  const TEST_SECRET = 'test_secret_key_for_hmac_hashing_32bytes_long';
  const TEST_ENC_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    OtpService.clearStoreForTesting();
  });

  describe('1. Phone Normalization & Validation (E.164 India)', () => {
    it('normalizes 10-digit Indian numbers starting with 6, 7, 8, or 9', () => {
      assert.strictEqual(normalizeIndianPhone('9876543210'), '+919876543210');
      assert.strictEqual(normalizeIndianPhone('+91 98765 43210'), '+919876543210');
      assert.strictEqual(normalizeIndianPhone('09876543210'), '+919876543210');
      assert.strictEqual(normalizeIndianPhone('918765432109'), '+918765432109');
      assert.strictEqual(normalizeIndianPhone('7000012345'), '+917000012345');
      assert.strictEqual(normalizeIndianPhone('6123456789'), '+916123456789');
    });

    it('rejects invalid mobile numbers (starting with 1-5 or wrong lengths)', () => {
      assert.throws(() => normalizeIndianPhone('5876543210'), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone('1234567890'), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone('98765'), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone('987654321000'), /valid 10-digit Indian mobile number/);
      assert.throws(() => normalizeIndianPhone(''), /Phone number is required/);
    });

    it('masks phone number correctly for user profile displays', () => {
      assert.strictEqual(maskPhone('+919876543210'), '+91 ******3210');
      assert.strictEqual(maskPhone('9876543210'), '+91 ******3210');
    });
  });

  describe('2. Phone Storage Security (AES-256-GCM & HMAC-SHA256)', () => {
    it('encrypts and decrypts phone number using AES-256-GCM', () => {
      const original = '+919876543210';
      const encrypted = encryptPhone(original, TEST_ENC_KEY);

      // Must be formatted as iv:authTag:ciphertext
      const parts = encrypted.split(':');
      assert.strictEqual(parts.length, 3);
      assert.strictEqual(parts[0].length, 24); // 12-byte IV in hex
      assert.strictEqual(parts[1].length, 32); // 16-byte auth tag in hex

      // Must not contain plaintext
      assert.ok(!encrypted.includes('9876543210'));

      // Round trip decryption
      const decrypted = decryptPhone(encrypted, TEST_ENC_KEY);
      assert.strictEqual(decrypted, original);
    });

    it('fails decryption if encrypted payload is tampered', () => {
      const encrypted = encryptPhone('+919876543210', TEST_ENC_KEY);
      const parts = encrypted.split(':');
      // Tamper ciphertext
      parts[2] = parts[2].slice(0, -2) + 'aa';
      const tampered = parts.join(':');

      assert.throws(() => decryptPhone(tampered, TEST_ENC_KEY));
    });

    it('computes deterministic HMAC-SHA256 hash for database index', () => {
      const hash1 = hashPhone('+919876543210', TEST_SECRET);
      const hash2 = hashPhone('9876543210', TEST_SECRET);
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64);
    });
  });

  describe('3. OTP Generation, Cooldown & Attempt Lockout', () => {
    it('requests OTP and enforces 60-second cooldown on consecutive requests', async () => {
      const phone = '9876543210';
      const res1 = await OtpService.requestOtp(phone, '1.2.3.4');
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.message, 'If this mobile number is valid, an OTP has been sent.');

      // Second immediate request must be blocked by cooldown
      const res2 = await OtpService.requestOtp(phone, '1.2.3.4');
      assert.strictEqual(res2.success, false);
      assert.ok(res2.retryAfter !== undefined && res2.retryAfter > 0);
      assert.ok(res2.message.includes('seconds before requesting a new OTP'));
    });

    it('locks out after 5 incorrect attempts and invalidates OTP', async () => {
      const phone = '9876543210';
      await OtpService.requestOtp(phone, '1.2.3.4');

      // 4 incorrect attempts
      for (let i = 1; i <= 4; i++) {
        const check = await OtpService.verifyOtp(phone, '000000');
        assert.strictEqual(check.valid, false);
        assert.ok(check.reason?.includes(`${5 - i} attempts remaining`));
      }

      // 5th incorrect attempt -> lockout
      const fifthCheck = await OtpService.verifyOtp(phone, '000000');
      assert.strictEqual(fifthCheck.valid, false);
      assert.ok(fifthCheck.reason?.includes('Maximum attempts'));

      // 6th attempt -> OTP should be completely invalid/deleted
      const sixthCheck = await OtpService.verifyOtp(phone, '000000');
      assert.strictEqual(sixthCheck.valid, false);
      assert.ok(sixthCheck.reason?.includes('expired or was not requested'));
    });

    it('enforces IP rate limits (max 20/hour)', async () => {
      const ip = '192.168.1.100';
      // Request for 20 different phone numbers from same IP
      for (let i = 1; i <= 20; i++) {
        const phone = `98765432${i.toString().padStart(2, '0')}`;
        const res = await OtpService.requestOtp(phone, ip);
        assert.strictEqual(res.success, true);
      }

      // 21st request from same IP must be rejected
      const blocked = await OtpService.requestOtp('9876543299', ip);
      assert.strictEqual(blocked.success, false);
      assert.ok(blocked.message.includes('Too many requests from this IP'));
    });
  });

  describe('4. Schema Validations (Request, Verify, Profile)', () => {
    it('RequestOtpSchema rejects unknown fields and invalid length', () => {
      assert.throws(() => RequestOtpSchema.parse({ phone: '123' }));
      assert.throws(() => RequestOtpSchema.parse({ phone: '9876543210', role: 'admin' }));
    });

    it('VerifyOtpSchema requires exact 6-digit OTP', () => {
      assert.ok(VerifyOtpSchema.parse({ phone: '9876543210', otp: '123456' }));
      assert.throws(() => VerifyOtpSchema.parse({ phone: '9876543210', otp: '12345' }));
      assert.throws(() => VerifyOtpSchema.parse({ phone: '9876543210', otp: '1234567' }));
    });

    it('UpdateProfileSchema validates displayName length and DPDP consent', () => {
      const valid = UpdateProfileSchema.parse({
        displayName: 'Akurdi Resident',
        homeWard: 'Ward 10',
        consent: {
          consentVersion: '1.0',
          consented: true,
        },
      });
      assert.strictEqual(valid.displayName, 'Akurdi Resident');

      // Display name too short
      assert.throws(() => UpdateProfileSchema.parse({ displayName: 'A' }));
      // Display name too long (> 40)
      assert.throws(() => UpdateProfileSchema.parse({ displayName: 'A'.repeat(45) }));
    });
  });
});
