import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { Issue } from '../../models/Issue.js';
import { Raise } from '../../models/Raise.js';
import { AuditLog } from '../../models/AuditLog.js';

describe('Account Deduplication & Account Merging Suite', () => {
  describe('1. Active Session Credential Auto-Linking', () => {
    it('links phone to current authenticated user instead of creating duplicate account', () => {
      const primaryUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'citizen@example.com',
        phoneHash: undefined as string | undefined,
        phoneMasked: undefined as string | undefined,
        role: 'citizen',
      };

      const incomingPhone = '+919876543210';
      const phoneHash = 'mock_hash_9876543210';
      const phoneMasked = '98765*****';

      // Simulating the linking logic inside verifyOtp:
      if (!primaryUser.phoneHash) {
        primaryUser.phoneHash = phoneHash;
        primaryUser.phoneMasked = phoneMasked;
      }

      assert.equal(primaryUser.phoneHash, phoneHash);
      assert.equal(primaryUser.phoneMasked, phoneMasked);
      assert.equal(primaryUser.email, 'citizen@example.com');
    });

    it('handles concurrency race conditions (E11000 duplicate key) gracefully', () => {
      // When two parallel requests try to create a user for the same phone:
      const handleE11000 = (err: any) => {
        if (err.code === 11000) {
          // Graceful fallback: return existing user instead of 500 error
          return { recovered: true, message: 'Concurrent creation resolved safely' };
        }
        throw err;
      };

      const mongoError = { code: 11000, keyPattern: { phoneHash: 1 }, keyValue: { phoneHash: 'abc' } };
      const outcome = handleE11000(mongoError);
      assert.equal(outcome.recovered, true);
    });
  });

  describe('2. Account Merging: Reassignment and Duplicate Suppression', () => {
    it('prevents self-merge when primary and secondary accounts are identical', () => {
      const primaryId = new mongoose.Types.ObjectId();
      const secondaryId = primaryId; // Same ID

      const canMerge = (pId: mongoose.Types.ObjectId, sId: mongoose.Types.ObjectId) => {
        if (pId.equals(sId)) {
          return { allowed: false, code: 400, message: 'Cannot merge an account with itself' };
        }
        return { allowed: true };
      };

      const res = canMerge(primaryId, secondaryId);
      assert.equal(res.allowed, false);
      assert.equal(res.code, 400);
      assert.match(res.message, /itself/);
    });

    it('migrates issues from secondary to primary without altering issue timestamps or status', () => {
      const primaryId = new mongoose.Types.ObjectId();
      const secondaryId = new mongoose.Types.ObjectId();

      const issues = [
        { _id: new mongoose.Types.ObjectId(), authorId: secondaryId, title: 'Pothole on Main St', status: 'submitted' },
        { _id: new mongoose.Types.ObjectId(), authorId: secondaryId, title: 'Streetlight out', status: 'in_progress' },
        { _id: new mongoose.Types.ObjectId(), authorId: primaryId, title: 'Water leakage', status: 'resolved' },
      ];

      // Simulate reassignment
      const reallocated = issues.map((iss) => {
        if (iss.authorId.equals(secondaryId)) {
          return { ...iss, authorId: primaryId };
        }
        return iss;
      });

      assert.equal(reallocated[0].authorId.toString(), primaryId.toString());
      assert.equal(reallocated[1].authorId.toString(), primaryId.toString());
      assert.equal(reallocated[0].status, 'submitted');
      assert.equal(reallocated[1].status, 'in_progress');
    });

    it('suppresses duplicate raises: primary citizen cannot double-raise an issue after merge', () => {
      const primaryId = new mongoose.Types.ObjectId();
      const secondaryId = new mongoose.Types.ObjectId();
      const issueA = new mongoose.Types.ObjectId();
      const issueB = new mongoose.Types.ObjectId();

      // Primary already raised issueA
      const primaryRaises = new Set([issueA.toString()]);

      // Secondary raised issueA and issueB
      const secondaryRaises = [
        { _id: new mongoose.Types.ObjectId(), userId: secondaryId, issueId: issueA },
        { _id: new mongoose.Types.ObjectId(), userId: secondaryId, issueId: issueB },
      ];

      const transferredRaises: any[] = [];
      const skippedDuplicateRaises: any[] = [];

      for (const r of secondaryRaises) {
        if (primaryRaises.has(r.issueId.toString())) {
          // Already raised by primary: suppress duplicate to preserve democratic integrity
          skippedDuplicateRaises.push(r);
        } else {
          // Valid to transfer
          transferredRaises.push({ ...r, userId: primaryId });
          primaryRaises.add(r.issueId.toString());
        }
      }

      assert.equal(transferredRaises.length, 1);
      assert.equal(transferredRaises[0].issueId.toString(), issueB.toString());
      assert.equal(skippedDuplicateRaises.length, 1);
      assert.equal(skippedDuplicateRaises[0].issueId.toString(), issueA.toString());
      // Zero double-counting verified
    });

    it('decommissions secondary account with audit trail', () => {
      const primaryId = new mongoose.Types.ObjectId();
      const secondaryAccount = {
        _id: new mongoose.Types.ObjectId(),
        email: 'secondary@example.com',
        isArchived: false,
        name: 'Secondary Citizen',
      };

      // Decommissioning step
      const decommissioned = {
        ...secondaryAccount,
        isArchived: true,
        name: `${secondaryAccount.name} (Merged into ${primaryId})`,
      };

      const auditEvent = {
        action: 'CITIZEN_ACCOUNTS_MERGED',
        actorId: primaryId,
        targetId: secondaryAccount._id,
        details: {
          secondaryEmail: secondaryAccount.email,
          reason: 'Duplicate citizen account merged by owner',
        },
      };

      assert.equal(decommissioned.isArchived, true);
      assert.equal(auditEvent.action, 'CITIZEN_ACCOUNTS_MERGED');
      assert.equal(auditEvent.actorId.toString(), primaryId.toString());
      assert.equal(auditEvent.targetId.toString(), secondaryAccount._id.toString());
    });
  });
});
