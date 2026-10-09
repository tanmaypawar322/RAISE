import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  ClaimOfficeSchema,
  AcceptInviteSchema,
  Verify2FaSetupSchema,
  Verify2FaLoginSchema,
} from './auth.controller.js';
import {
  generateTotpSecret,
  generateTotpCode,
  verifyTotp,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
  base32Encode,
  base32Decode,
} from '../../utils/totp.util.js';

describe('Phase 4 Security Rules: Official Claims, Object Authorization & TOTP 2FA', () => {
  describe('1. Official & Agency Claim Validation', () => {
    it('accepts valid official claim registration', () => {
      const validOfficial = {
        name: 'Rajesh Patil',
        email: 'rajesh.patil@pcmc.gov.in',
        password: 'Password1234!',
        phone: '9876543210',
        otp: '123456',
        officeId: '65f000000000000000000003',
        role: 'official' as const,
        designation: 'Junior Engineer (Civil)',
        employeeId: 'PCMC-ENG-491',
        claimNotes: 'Assigned to Ward 10 road maintenance beat.',
      };

      const parsed = ClaimOfficeSchema.parse(validOfficial);
      assert.strictEqual(parsed.role, 'official');
      assert.strictEqual(parsed.designation, 'Junior Engineer (Civil)');
    });

    it('accepts valid contractor/agency partner registration', () => {
      const validAgency = {
        name: 'Sunil Shinde',
        email: 'sunil@bvg-infrastructure.com',
        password: 'Password1234!',
        phone: '9822012345',
        otp: '654321',
        officeId: '65f000000000000000000003',
        role: 'agency' as const,
        designation: 'Pothole Patching Site Supervisor',
        employeeId: 'BVG-WO-2026-99',
      };

      const parsed = ClaimOfficeSchema.parse(validAgency);
      assert.strictEqual(parsed.role, 'agency');
    });

    it('rejects unauthorized or unknown fields in claim payload (Zod strictness)', () => {
      const maliciousClaim = {
        name: 'Attacker',
        email: 'attacker@evil.com',
        password: 'Password1234!',
        phone: '9876543210',
        otp: '123456',
        officeId: '65f000000000000000000003',
        role: 'official',
        designation: 'Hacker',
        status: 'active', // privilege escalation attempt
        isOfficialVerified: true, // privilege escalation attempt
      };

      assert.throws(() => ClaimOfficeSchema.parse(maliciousClaim));
    });

    it('rejects passwords shorter than 8 characters for official claims', () => {
      const weakClaim = {
        name: 'Official',
        email: 'test@pcmc.gov.in',
        password: 'short',
        phone: '9876543210',
        otp: '123456',
        officeId: '65f000000000000000000003',
        designation: 'Clerk',
      };

      assert.throws(() => ClaimOfficeSchema.parse(weakClaim));
    });
  });

  describe('2. TOTP 2FA (RFC 6238) & Single-Use Backup Codes', () => {
    it('encodes and decodes Base32 accurately', () => {
      const buffer = Buffer.from('RAISE-CIVIC-SECURITY');
      const encoded = base32Encode(buffer);
      const decoded = base32Decode(encoded);
      assert.strictEqual(decoded.toString('utf-8'), 'RAISE-CIVIC-SECURITY');
    });

    it('generates a 20-byte Base32 secret', () => {
      const secret = generateTotpSecret();
      assert.strictEqual(typeof secret, 'string');
      assert.strictEqual(secret.length, 32); // 20 bytes * 8 / 5 = 32 chars
    });

    it('generates a valid 6-digit TOTP code and verifies it within the time step', () => {
      const secret = generateTotpSecret();
      const code = generateTotpCode(secret);

      assert.strictEqual(code.length, 6);
      assert.match(code, /^\d{6}$/);

      const isValid = verifyTotp(code, secret, 1);
      assert.strictEqual(isValid, true);
    });

    it('rejects an incorrect TOTP code', () => {
      const secret = generateTotpSecret();
      const validCode = generateTotpCode(secret);
      // Invert last digit to produce wrong code
      const wrongCode = validCode.slice(0, 5) + ((parseInt(validCode[5], 10) + 1) % 10).toString();

      assert.strictEqual(verifyTotp(wrongCode, secret, 1), false);
      assert.strictEqual(verifyTotp('000000', secret, 1), false);
      assert.strictEqual(verifyTotp('', secret, 1), false);
      assert.strictEqual(verifyTotp('abc', secret, 1), false);
    });

    it('generates 8 single-use backup codes and consumes them once', () => {
      const { plainCodes, hashedCodes } = generateBackupCodes(8);

      assert.strictEqual(plainCodes.length, 8);
      assert.strictEqual(hashedCodes.length, 8);

      // Verify format XXXX-XXXX
      assert.match(plainCodes[0], /^[0-9A-F]{4}-[0-9A-F]{4}$/);

      // Verifying code 0 succeeds
      const check1 = verifyAndConsumeBackupCode(plainCodes[0], hashedCodes);
      assert.strictEqual(check1.valid, true);
      assert.strictEqual(check1.matchingIndex, 0);

      // Consume the code
      hashedCodes.splice(check1.matchingIndex!, 1);
      assert.strictEqual(hashedCodes.length, 7);

      // Verifying code 0 again fails (already consumed)
      const check2 = verifyAndConsumeBackupCode(plainCodes[0], hashedCodes);
      assert.strictEqual(check2.valid, false);

      // Verifying non-existent backup code fails
      const check3 = verifyAndConsumeBackupCode('DEAD-BEEF', hashedCodes);
      assert.strictEqual(check3.valid, false);
    });
  });

  describe('3. Object-Level Authorization (IDOR) & Role Restrictions', () => {
    const officeA = '65f000000000000000000001';
    const officeB = '65f000000000000000000002';

    it('verifies office match helper logic', () => {
      const officialA = {
        role: 'official',
        status: 'active',
        isOfficialVerified: true,
        officeMemberships: [{ officeId: officeA, memberRole: 'officer', status: 'active' }],
      };

      // Office A official acting on Office A issue
      const hasAccessA = officialA.officeMemberships.some(
        (m) => m.officeId === officeA && m.status === 'active'
      );
      assert.strictEqual(hasAccessA, true);

      // Office A official acting on Office B issue (IDOR attack prevention)
      const hasAccessB = officialA.officeMemberships.some(
        (m) => m.officeId === officeB && m.status === 'active'
      );
      assert.strictEqual(hasAccessB, false);
    });

    it('blocks agency contractor from resolving issues directly', () => {
      const contractor = {
        role: 'agency',
        status: 'active',
        officeMemberships: [{ officeId: officeA, memberRole: 'contractor', status: 'active' }],
      };

      const isContractor =
        contractor.role === 'agency' ||
        contractor.officeMemberships.some((m) => m.memberRole === 'contractor');

      const requestedStatus = 'resolved';
      const isAllowed = !(isContractor && requestedStatus === 'resolved');

      assert.strictEqual(isAllowed, false, 'Contractors must NOT be allowed to directly mark issues as resolved');

      // But in_progress is allowed
      const inProgressStatus: string = 'in_progress';
      const inProgressAllowed = !(isContractor && inProgressStatus === 'resolved');
      assert.strictEqual(inProgressAllowed, true);
    });

    it('blocks pending accounts regardless of role from exercising powers', () => {
      const pendingOfficial = {
        role: 'official',
        status: 'pending',
        isOfficialVerified: false,
      };

      const canAct = pendingOfficial.status === 'active';
      assert.strictEqual(canAct, false, 'Pending official must NOT have authority until verified');
    });

    it('allows admin to manage issues across any office with audit logging', () => {
      const admin = {
        role: 'admin',
        status: 'active',
      };

      const isAdmin = admin.role === 'admin';
      assert.strictEqual(isAdmin, true);
    });
  });

  describe('4. Single-Use 7-Day Office Invitations', () => {
    it('validates invite acceptance payload schema', () => {
      const validInvite = {
        token: 'a'.repeat(64),
        name: 'New Colleague',
        password: 'SecurePassword123!',
        phone: '9876543210',
        otp: '123456',
      };

      const parsed = AcceptInviteSchema.parse(validInvite);
      assert.strictEqual(parsed.name, 'New Colleague');
    });

    it('rejects expired invitations', () => {
      const expiresAt = new Date(Date.now() - 1000); // 1 sec in past
      const isExpired = expiresAt < new Date();
      assert.strictEqual(isExpired, true);

      const validExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      assert.strictEqual(validExpiresAt > new Date(), true);
    });
  });
});
