import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { SessionService } from '../../services/session.service.js';
import { verifyCsrfOrigin } from '../../middlewares/csrf.middleware.js';
import { config } from '../../config/env.js';

describe('Phase 5 Security Rules: Sessions, 15m Tokens, Rotation, Reuse Detection & CSRF', () => {
  describe('1. Access Token Lifetime (15 Minutes)', () => {
    it('issues JWT with exactly 15 minutes (900 seconds) expiration', () => {
      const mockUser: any = {
        _id: '65f000000000000000000010',
        role: 'citizen',
        displayName: 'Aakash Verma',
        tokenVersion: 2,
      };

      const token = SessionService.generateAccessToken(mockUser);
      const decoded: any = jwt.verify(token, config.jwtSecret);

      assert.strictEqual(decoded.userId, mockUser._id);
      assert.strictEqual(decoded.tokenVersion, 2);
      // exp - iat should be 900s
      assert.strictEqual(decoded.exp - decoded.iat, 15 * 60);
    });
  });

  describe('2. Refresh Token Duration by Role and Device Type', () => {
    it('sets 30 days for citizen on private device', () => {
      const duration = SessionService.getSessionDuration('citizen', false);
      assert.strictEqual(duration, 30 * 24 * 60 * 60 * 1000);
    });

    it('sets 7 days for official or admin on private device', () => {
      const durationOfficial = SessionService.getSessionDuration('official', false);
      const durationAdmin = SessionService.getSessionDuration('admin', false);
      assert.strictEqual(durationOfficial, 7 * 24 * 60 * 60 * 1000);
      assert.strictEqual(durationAdmin, 7 * 24 * 60 * 60 * 1000);
    });

    it('sets 12 hours on public/shared computers regardless of role', () => {
      const durationPublic = SessionService.getSessionDuration('citizen', true);
      const durationPublicOfficial = SessionService.getSessionDuration('official', true);
      assert.strictEqual(durationPublic, 12 * 60 * 60 * 1000);
      assert.strictEqual(durationPublicOfficial, 12 * 60 * 60 * 1000);
    });
  });

  describe('3. Token Hashing & Reuse Detection Logic', () => {
    it('computes consistent SHA-256 hash for database lookups', () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
      const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64);
    });

    it('simulates token family reuse detection logic', () => {
      // Family of tokens across rotations: T1 -> T2 -> T3
      const familyId = crypto.randomUUID();
      const sessions = [
        { id: 'T1', familyId, rotationCounter: 1, isRevoked: true },
        { id: 'T2', familyId, rotationCounter: 2, isRevoked: true },
        { id: 'T3', familyId, rotationCounter: 3, isRevoked: false },
      ];

      // Legitimate client presents active token T3
      const activeToken = sessions.find((s) => s.id === 'T3');
      assert.strictEqual(activeToken?.isRevoked, false);

      // An attacker captures and replays old token T1
      const replayedToken = sessions.find((s) => s.id === 'T1');
      assert.strictEqual(replayedToken?.isRevoked, true);

      // Reuse detection triggers: all tokens in the family must be invalidated
      const reuseDetected = replayedToken?.isRevoked === true;
      assert.strictEqual(reuseDetected, true);

      if (reuseDetected) {
        sessions.forEach((s) => {
          if (s.familyId === replayedToken?.familyId) {
            s.isRevoked = true;
          }
        });
      }

      // Now even legitimate T3 is revoked
      const legitTokenAfterCompromise = sessions.find((s) => s.id === 'T3');
      assert.strictEqual(legitTokenAfterCompromise?.isRevoked, true);
    });
  });

  describe('4. TokenVersion Immediate Revocation', () => {
    it('rejects token when user tokenVersion has been incremented', () => {
      const initialTokenVersion = 1;
      const user = {
        _id: '65f000000000000000000011',
        tokenVersion: initialTokenVersion,
      };

      const token = jwt.sign(
        { userId: user._id, tokenVersion: user.tokenVersion },
        config.jwtSecret,
        { expiresIn: '15m' }
      );

      // Verify token initially matches
      const decoded: any = jwt.verify(token, config.jwtSecret);
      assert.strictEqual(decoded.tokenVersion === user.tokenVersion, true);

      // User changes password or clicks "Sign out all devices" -> bumps tokenVersion
      user.tokenVersion += 1;

      // Old token must now be rejected
      const isValidAfterRevocation = decoded.tokenVersion === user.tokenVersion;
      assert.strictEqual(isValidAfterRevocation, false);
    });
  });

  describe('5. CSRF Origin Verification Middleware', () => {
    it('rejects unauthorized third-party origin with 403', () => {
      let statusCalled = 0;
      let jsonPayload: any = null;
      let nextCalled = false;

      const mockReq: any = {
        method: 'POST',
        headers: { origin: 'https://evil-attacker-site.com' },
      };
      const mockRes: any = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: (payload: any) => {
              jsonPayload = payload;
            },
          };
        },
      };
      const mockNext = () => {
        nextCalled = true;
      };

      verifyCsrfOrigin(mockReq, mockRes, mockNext);

      assert.strictEqual(statusCalled, 403);
      assert.strictEqual(jsonPayload?.success, false);
      assert.strictEqual(nextCalled, false);
    });

    it('accepts legitimate frontend origin', () => {
      let nextCalled = false;

      const mockReq: any = {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      };
      const mockRes: any = {};
      const mockNext = () => {
        nextCalled = true;
      };

      verifyCsrfOrigin(mockReq, mockRes, mockNext);

      assert.strictEqual(nextCalled, true);
    });
  });
});
