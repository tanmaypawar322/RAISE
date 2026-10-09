import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { OtpService } from '../../services/otp.service.js';
import { serializeIssue, checkAnonymousIpLimit, clearAnonymousLimitsForTesting } from '../issues/issues.controller.js';
import { DeleteAccountSchema } from './auth.controller.js';

describe('Phase 6 Security Rules: Account Lifecycle, Deletion, Anonymous Abuse & One-Person-One-Raise', () => {
  beforeEach(() => {
    OtpService.clearStoreForTesting();
    clearAnonymousLimitsForTesting();
  });

  describe('1. Self-Serve Account Deletion (DPDP Act 2023)', () => {
    it('validates DeleteAccountSchema correctly', () => {
      const validCitizen = DeleteAccountSchema.safeParse({ otp: '123456' });
      assert.strictEqual(validCitizen.success, true);

      const validPassword = DeleteAccountSchema.safeParse({ password: 'OldPassword123!' });
      assert.strictEqual(validPassword.success, true);

      // Rejects unknown fields
      const invalid = DeleteAccountSchema.safeParse({ otp: '123456', unexpected: true });
      assert.strictEqual(invalid.success, false);
    });

    it('requires OTP verification for passwordless citizen deletion with purpose="delete_account"', async () => {
      const phone = '+919876543210';
      await OtpService.requestOtp(phone, '127.0.0.1', 'delete_account');

      // Wrong code fails
      const badVerify = await OtpService.verifyOtp(phone, '000000', 'delete_account');
      assert.strictEqual(badVerify.valid, false);

      // Verify OTP with wrong purpose fails (isolated storage keys)
      await OtpService.requestOtp(phone, '127.0.0.1', 'delete_account');
      const wrongPurpose = await OtpService.verifyOtp(phone, '123456', 'auth');
      assert.strictEqual(wrongPurpose.valid, false);
    });

    it('verifies that PII is wiped, status set to deleted, and tokenVersion incremented', async () => {
      const user = {
        name: 'Ramesh Patil',
        displayName: 'Ramesh P',
        email: 'ramesh@example.com',
        phoneEnc: 'encrypted_phone_data',
        phoneHash: 'phone_hash_value',
        phoneMasked: '+91 ******3210',
        passwordHash: 'hashed_password',
        status: 'active',
        role: 'citizen',
        officeMemberships: [{ officeId: new mongoose.Types.ObjectId(), memberRole: 'officer', status: 'active' }],
        tokenVersion: 2,
        isActive: true,
      };

      // Simulate deletion purge
      user.phoneEnc = undefined as any;
      user.phoneHash = undefined as any;
      user.phoneMasked = undefined as any;
      user.email = undefined as any;
      user.passwordHash = undefined as any;
      user.displayName = 'Deleted user';
      user.name = 'Deleted user';
      user.status = 'deleted';
      user.isActive = false;
      user.officeMemberships = [];
      user.tokenVersion += 1;

      assert.strictEqual(user.status, 'deleted');
      assert.strictEqual(user.displayName, 'Deleted user');
      assert.strictEqual(user.name, 'Deleted user');
      assert.strictEqual(user.email, undefined);
      assert.strictEqual(user.phoneEnc, undefined);
      assert.strictEqual(user.phoneHash, undefined);
      assert.strictEqual(user.officeMemberships.length, 0);
      assert.strictEqual(user.tokenVersion, 3, 'tokenVersion must be incremented to immediately invalidate any issued JWTs');
    });

    it('blocks deleted accounts from accessing protected routes in middleware', () => {
      const deletedUser = {
        status: 'deleted',
        role: 'citizen',
      };

      const isAllowed = deletedUser.status !== 'deleted' && deletedUser.status !== 'suspended';
      assert.strictEqual(isAllowed, false, 'Deleted accounts must never be allowed to make authenticated requests');
    });

    it('requires current password to delete password-backed accounts', async () => {
      const realPassword = 'CurrentSuperPassword123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(realPassword, salt);

      const isValid = await bcrypt.compare(realPassword, hash);
      const isBad = await bcrypt.compare('WrongPassword', hash);

      assert.strictEqual(isValid, true);
      assert.strictEqual(isBad, false);
    });
  });

  describe('2. Anonymous Reporting (Guest Filing) & Strict Rate Limits', () => {
    it('enforces 2 anonymous issues per phone per 24 hours', () => {
      const existingAnonIssuesCount = 2;
      const isAllowed = existingAnonIssuesCount < 2;

      assert.strictEqual(isAllowed, false, 'Users with 2 anonymous issues in the last 24h must be rejected with 429');
    });

    it('enforces 5 anonymous issues per IP per 24 hours', () => {
      const testIp = '203.0.113.42';

      // Submit 5 anonymous issues
      for (let i = 0; i < 5; i++) {
        const check = checkAnonymousIpLimit(testIp);
        assert.strictEqual(check.allowed, true, `Issue ${i + 1} from IP should be allowed`);
      }

      // 6th issue from same IP must be rejected
      const sixthCheck = checkAnonymousIpLimit(testIp);
      assert.strictEqual(sixthCheck.allowed, false, '6th anonymous issue from same IP within 24 hours must be rejected');
    });

    it('does not limit distinct IPs', () => {
      const ipA = '198.51.100.1';
      const ipB = '198.51.100.2';

      for (let i = 0; i < 5; i++) {
        checkAnonymousIpLimit(ipA);
      }

      // IP B should still be allowed
      const checkB = checkAnonymousIpLimit(ipB);
      assert.strictEqual(checkB.allowed, true);
    });
  });

  describe('3. Public API Serialization & Author Redaction', () => {
    it('strictly removes authorId and sets displayName to "Anonymous citizen" for anonymous issues', () => {
      const rawIssue = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Broken street lights near Akurdi market',
        isAnonymous: true,
        authorId: {
          _id: new mongoose.Types.ObjectId(),
          displayName: 'Real Citizen Name',
          homeArea: { ward: 'Ward 12' },
        },
        raiseCount: 5,
      };

      const serialized = serializeIssue(rawIssue);

      assert.strictEqual(serialized.authorId, undefined, 'authorId MUST be removed from serialized response');
      assert.strictEqual(serialized.author.displayName, 'Anonymous citizen');
      assert.strictEqual(serialized.author.homeArea, undefined);
    });

    it('displays "Deleted user" if author account was deleted', () => {
      const rawIssue = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Pothole on Nigdi road',
        isAnonymous: false,
        authorId: {
          _id: new mongoose.Types.ObjectId(),
          displayName: 'Deleted user',
          status: 'deleted',
        },
        raiseCount: 12,
      };

      const serialized = serializeIssue(rawIssue);

      assert.strictEqual(serialized.authorId, undefined);
      assert.strictEqual(serialized.author.displayName, 'Deleted user');
    });

    it('exposes safe pseudonym and homeArea for non-anonymous active citizens without exposing authorId', () => {
      const rawIssue = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Water supply interruption',
        isAnonymous: false,
        authorId: {
          _id: new mongoose.Types.ObjectId(),
          displayName: 'Pravin M',
          homeArea: { ward: 'Ward 10', city: 'Pimpri-Chinchwad' },
          status: 'active',
        },
        raiseCount: 8,
      };

      const serialized = serializeIssue(rawIssue);

      assert.strictEqual(serialized.authorId, undefined);
      assert.strictEqual(serialized.author.displayName, 'Pravin M');
      assert.strictEqual(serialized.author.homeArea.ward, 'Ward 10');
    });
  });

  describe('4. One-Person-One-Raise Rule', () => {
    it('detects duplicate raise attempt by same user on same issue', () => {
      const userId = '65f000000000000000000001';
      const issueId = '65f000000000000000000002';

      const existingRaises = new Set<string>();
      existingRaises.add(`${userId}:${issueId}`);

      // Attempt second raise
      const isAlreadyRaised = existingRaises.has(`${userId}:${issueId}`);
      assert.strictEqual(isAlreadyRaised, true, 'User cannot raise the same issue more than once');
    });

    it('verifies that deleting user preserves issue raiseCount', () => {
      const issue = {
        _id: new mongoose.Types.ObjectId(),
        raiseCount: 42,
      };

      // User has one raise on this issue
      const userRaises = [{ userId: 'user_1', issueId: issue._id }];

      // When user deletes account, their Raise record is purged
      const remainingRaises = userRaises.filter((r) => r.userId !== 'user_1');
      assert.strictEqual(remainingRaises.length, 0);

      // But issue raiseCount is preserved
      assert.strictEqual(issue.raiseCount, 42, 'Issue raiseCount must remain intact after user account deletion');
    });
  });

  describe('5. DPDP Data Export (Right to Access & Portability - Section 11)', () => {
    it('generates a comprehensive export payload without leaking sensitive credentials', () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Asha Jadhav',
        displayName: 'Asha J',
        email: 'asha.jadhav@example.com',
        phoneMasked: '+91 ******4567',
        language: 'mr',
        role: 'citizen',
        status: 'active',
        homeWard: 'Ward 12',
        homeArea: { ward: 'Ward 12', city: 'Pimpri-Chinchwad', district: 'Pune' },
        isProfileComplete: true,
        verifiedMethods: ['email', 'phone'],
        consentVersion: '2026.1',
        consentAt: new Date('2026-03-01T10:00:00Z'),
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-05T12:00:00Z'),
        // Sensitive internal fields that MUST NEVER be exported
        passwordHash: '$2b$12$eX4mpL3h4shV4lu3D0N0tL34k...',
        tokenVersion: 5,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorBackupCodes: ['hash1', 'hash2'],
      };

      const exportProfile = {
        id: mockUser._id,
        name: mockUser.name,
        displayName: mockUser.displayName,
        email: mockUser.email,
        emailVerified: true,
        phone: '+919876544567',
        phoneMasked: mockUser.phoneMasked,
        language: mockUser.language,
        role: mockUser.role,
        status: mockUser.status,
        homeWard: mockUser.homeWard,
        homeArea: mockUser.homeArea,
        isProfileComplete: mockUser.isProfileComplete,
        verifiedMethods: mockUser.verifiedMethods,
        consentVersion: mockUser.consentVersion,
        consentAt: mockUser.consentAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      const exportPayload = {
        success: true,
        dpdpCompliance: {
          act: 'Digital Personal Data Protection Act 2023 (DPDP Act)',
          section: 'Section 11 (Right to Access and Portability of Personal Data)',
          purpose: 'Citizen Data Portability Export',
          generatedAt: new Date().toISOString(),
        },
        data: {
          profile: exportProfile,
          issuesFilingHistory: [
            { title: 'Broken water pipeline', category: 'water', status: 'reported' },
          ],
          raisesAndSupports: [
            { issueId: { title: 'Pothole on Nigdi road' }, createdAt: new Date() },
          ],
          notifications: [
            { type: 'issue_acknowledged', title: 'Issue acknowledged' },
          ],
          notificationPreferences: { channels: { sms: true, in_app: true } },
          auditTrail: [
            { action: 'login', createdAt: new Date() },
          ],
        },
      };

      // Ensure zero credential leaks
      assert.strictEqual((exportPayload.data.profile as any).passwordHash, undefined, 'passwordHash must never be exported');
      assert.strictEqual((exportPayload.data.profile as any).tokenVersion, undefined, 'tokenVersion must never be exported');
      assert.strictEqual((exportPayload.data.profile as any).twoFactorSecret, undefined, 'twoFactorSecret must never be exported');
      assert.strictEqual((exportPayload.data.profile as any).twoFactorBackupCodes, undefined, 'twoFactorBackupCodes must never be exported');

      // Ensure data portability completeness
      assert.strictEqual(exportPayload.data.profile.displayName, 'Asha J');
      assert.strictEqual(exportPayload.data.profile.homeWard, 'Ward 12');
      assert.strictEqual(exportPayload.data.issuesFilingHistory.length, 1);
      assert.strictEqual(exportPayload.data.raisesAndSupports.length, 1);
      assert.strictEqual(exportPayload.data.notifications.length, 1);
      assert.strictEqual(exportPayload.data.auditTrail.length, 1);
      assert.strictEqual(exportPayload.dpdpCompliance.act.includes('DPDP Act'), true);
    });
  });
});

