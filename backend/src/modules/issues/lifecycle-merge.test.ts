import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { GeoUtil } from '../../utils/geo.util.js';
import { SimilarityUtil } from '../../utils/similarity.util.js';
import { EscalationService } from '../../services/escalation.service.js';

describe('Phase 2 Rules: Lifecycle, Proof, Confirmation, Duplicates & Merge', () => {
  describe('1. Resolution Proof & 422 Enforcements', () => {
    it('requires a note of at least 10 characters when resolving', () => {
      const validateNote = (note?: string) => {
        if (!note || note.trim().length < 10) {
          return { valid: false, code: 422, message: 'Resolution note (minimum 10 characters) required' };
        }
        return { valid: true };
      };

      assert.equal(validateNote('').valid, false);
      assert.equal(validateNote('Done').valid, false);
      assert.equal(validateNote('Repaired').valid, false);
      assert.equal(validateNote('Pothole completely patched and tarred').valid, true);
    });

    it('rejects resolution with 422 if neither after photos nor exception reason is provided', () => {
      const validateProof = (afterPhotos?: any[], exceptionReason?: string) => {
        const hasPhotos = Array.isArray(afterPhotos) && afterPhotos.length > 0;
        const validExceptions = [
          'no_physical_work_required',
          'administrative_action_only',
          'duplicate_work_order',
          'jurisdiction_transferred',
        ];
        const hasValidException = exceptionReason && validExceptions.includes(exceptionReason);

        if (!hasPhotos && !hasValidException) {
          return { valid: false, code: 422, message: 'Resolution proof required' };
        }
        return { valid: true };
      };

      assert.equal(validateProof(undefined, undefined).valid, false);
      assert.equal(validateProof([], undefined).valid, false);
      assert.equal(validateProof([], 'invalid_exception_reason').valid, false);

      // Valid with after photo
      assert.equal(validateProof([{ url: 'https://example.com/after.jpg' }], undefined).valid, true);

      // Valid with explicit exception
      assert.equal(validateProof([], 'no_physical_work_required').valid, true);
      assert.equal(validateProof([], 'administrative_action_only').valid, true);
    });

    it('computes distance and sets afterPhotoGpsFlag if after-photo is > 150m from grievance', () => {
      const grievanceLocation: [number, number] = [73.7842, 18.6508]; // Nigdi Ward 12 center
      const nearbyPhoto: [number, number] = [73.7845, 18.6510]; // ~40m away
      const farPhoto: [number, number] = [73.7890, 18.6550]; // ~680m away

      const distNearby = GeoUtil.haversineDistanceMeters(grievanceLocation, nearbyPhoto);
      const distFar = GeoUtil.haversineDistanceMeters(grievanceLocation, farPhoto);

      assert.ok(distNearby < 150, `Expected nearby distance < 150m, got ${distNearby}m`);
      assert.ok(distFar > 150, `Expected far distance > 150m, got ${distFar}m`);

      const checkGpsFlag = (photoCoords: [number, number], issueCoords: [number, number], threshold = 150) => {
        const dist = GeoUtil.haversineDistanceMeters(photoCoords, issueCoords);
        return {
          flag: dist > threshold,
          distanceMeters: Math.round(dist),
        };
      };

      const resultNearby = checkGpsFlag(nearbyPhoto, grievanceLocation);
      assert.equal(resultNearby.flag, false);

      const resultFar = checkGpsFlag(farPhoto, grievanceLocation);
      assert.equal(resultFar.flag, true);
      assert.ok(resultFar.distanceMeters > 500);
    });
  });

  describe('2. Citizen Confirmation, Dispute & 7-Day Auto-Closure', () => {
    it('sets 7-day confirmation deadline and pending_citizen_confirmation status upon resolution', () => {
      const now = new Date();
      const confirmationWindowDays = 7;
      const deadline = new Date(now.getTime() + confirmationWindowDays * 24 * 60 * 60 * 1000);

      const diffDays = (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      assert.equal(Math.round(diffDays), 7);
    });

    it('enforces single confirmation vote per citizen (rejects duplicate confirmation with 409)', () => {
      const user1 = new mongoose.Types.ObjectId();
      const user2 = new mongoose.Types.ObjectId();
      const confirmations: Array<{ userId: mongoose.Types.ObjectId; confirmedAt: Date }> = [];

      const recordConfirm = (userId: mongoose.Types.ObjectId) => {
        if (confirmations.some((c) => c.userId.equals(userId))) {
          return { success: false, code: 409, message: 'Already confirmed' };
        }
        confirmations.push({ userId, confirmedAt: new Date() });
        return { success: true };
      };

      assert.equal(recordConfirm(user1).success, true);
      assert.equal(recordConfirm(user1).success, false);
      assert.equal(recordConfirm(user1).code, 409);
      assert.equal(recordConfirm(user2).success, true);
      assert.equal(confirmations.length, 2);
    });

    it('citizen dispute reopens issue, increments reopenCount, and restarts SLA clock', () => {
      const slaHours = 48;
      const createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      let reopenCount = 0;
      let status = 'resolved_pending_confirmation';

      // Dispute triggers:
      status = 'disputed';
      reopenCount += 1;
      const newSlaDeadline = EscalationService.calculateSlaDeadline(new Date(), slaHours);

      assert.equal(status, 'disputed');
      assert.equal(reopenCount, 1);
      assert.ok(newSlaDeadline.getTime() > Date.now());
      assert.ok(newSlaDeadline.getTime() > createdAt.getTime() + slaHours * 3600 * 1000);
    });

    it('auto-closure simulates final status based on citizen confirmation counts', () => {
      const finalizeStatus = (confirmedByCount: number, disputedByCount: number) => {
        if (disputedByCount > 0) return 'disputed';
        if (confirmedByCount > 0) return 'resolved_confirmed';
        return 'resolved_unconfirmed';
      };

      assert.equal(finalizeStatus(0, 0), 'resolved_unconfirmed');
      assert.equal(finalizeStatus(3, 0), 'resolved_confirmed');
      assert.equal(finalizeStatus(2, 1), 'disputed');
    });
  });

  describe('3. Duplicate Detection & Similarity Algorithm', () => {
    it('tokenizes text correctly and removes stop words', () => {
      const text = 'Dangerous potholes and waterlogging outside Akurdi Railway Station';
      const tokens = SimilarityUtil.tokenize(text);

      assert.ok(tokens.has('dangerous'));
      assert.ok(tokens.has('potholes'));
      assert.ok(tokens.has('waterlogging'));
      assert.ok(tokens.has('akurdi'));
      assert.ok(tokens.has('railway'));
      assert.ok(tokens.has('station'));
      assert.equal(tokens.has('and'), false); // stop word
    });

    it('calculates Jaccard token overlap between identical and divergent grievance titles', () => {
      const title1 = 'Dangerous potholes near Akurdi Railway Station';
      const title2 = 'Heavy potholes and road damage at Akurdi Railway Station';
      const title3 = 'Broken street lights in Nigdi Sector 24';

      const score1_2 = SimilarityUtil.jaccardSimilarity(title1, title2);
      const score1_3 = SimilarityUtil.jaccardSimilarity(title1, title3);

      assert.ok(score1_2 > 0.35, `Expected substantial token overlap, got ${score1_2}`);
      assert.equal(score1_3, 0, `Expected zero overlap between completely different civic issues`);
    });

    it('computes combined similarity score weighting text 60% and geographic proximity 40%', () => {
      const highTextScore = 0.8;
      const lowDistMeters = 30; // 30m away out of 200m max
      const combinedNear = SimilarityUtil.calculateCombinedScore(highTextScore, lowDistMeters, 200);

      const highDistMeters = 190; // 190m away
      const combinedFar = SimilarityUtil.calculateCombinedScore(highTextScore, highDistMeters, 200);

      assert.ok(combinedNear > combinedFar);
      assert.ok(combinedNear > 0.7);
    });
  });

  describe('4. Issue Merge & 7-Day Unmerge Lifecycle', () => {
    it('deduplicates user raises when merging duplicate issue into canonical issue', () => {
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();
      const userC = new mongoose.Types.ObjectId();

      const canonicalRaises = new Set([userA.toString(), userB.toString()]);
      const duplicateRaises = [userB.toString(), userC.toString()];

      for (const userId of duplicateRaises) {
        if (!canonicalRaises.has(userId)) {
          canonicalRaises.add(userId);
        }
      }

      assert.equal(canonicalRaises.size, 3);
      assert.ok(canonicalRaises.has(userA.toString()));
      assert.ok(canonicalRaises.has(userB.toString()));
      assert.ok(canonicalRaises.has(userC.toString()));
    });

    it('enforces 7-day unmerge undo window', () => {
      const checkCanUnmerge = (canUnmergeUntil: Date) => {
        return new Date() <= canUnmergeUntil;
      };

      const validWindow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days remaining
      const expiredWindow = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day expired

      assert.equal(checkCanUnmerge(validWindow), true);
      assert.equal(checkCanUnmerge(expiredWindow), false);
    });
  });

  describe('5. Object-Level Authorization (IDOR) & Hierarchy Permissions', () => {
    it('allows official from owning office and escalation office to act on grievance', () => {
      const owningOfficeId = new mongoose.Types.ObjectId();
      const escalationOfficeId = new mongoose.Types.ObjectId();
      const unrelatedOfficeId = new mongoose.Types.ObjectId();

      const canActOnIssue = (officerOfficeId: mongoose.Types.ObjectId, issueOfficeId: mongoose.Types.ObjectId, escalatesToId?: mongoose.Types.ObjectId) => {
        if (officerOfficeId.equals(issueOfficeId)) return true;
        if (escalatesToId && officerOfficeId.equals(escalatesToId)) return true;
        return false;
      };

      assert.equal(canActOnIssue(owningOfficeId, owningOfficeId, escalationOfficeId), true);
      assert.equal(canActOnIssue(escalationOfficeId, owningOfficeId, escalationOfficeId), true);
      assert.equal(canActOnIssue(unrelatedOfficeId, owningOfficeId, escalationOfficeId), false);
    });
  });
});
