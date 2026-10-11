import mongoose from 'mongoose';
import { RepresentativeProfile } from '../models/RepresentativeProfile.js';
import { User } from '../models/User.js';
import { AuditService } from './audit.service.js';

export interface TermExpiryResult {
  checkedCount: number;
  expiredProfilesCount: number;
  suspendedStaffCount: number;
  expiredProfiles: Array<{
    profileId: string;
    displayName: string;
    role: string;
    officeId?: string;
  }>;
}

export class RepresentativeTermService {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Scans for representative profiles whose termEnd has elapsed.
   * Marks them 'term_ended' (read-only, moves to past representatives).
   * Suspends staff memberships on the associated representative office pending admin review.
   */
  static async runTermExpiryCheck(): Promise<TermExpiryResult> {
    const now = new Date();

    const expiredCandidates = await RepresentativeProfile.find({
      termEnd: { $lt: now },
      status: { $in: ['verified', 'pending', 'unclaimed'] },
    });

    const expiredProfiles: TermExpiryResult['expiredProfiles'] = [];
    let suspendedStaffCount = 0;

    for (const profile of expiredCandidates) {
      const prevStatus = profile.status;
      profile.status = 'term_ended';
      await profile.save();

      await AuditService.log({
        action: 'representative_term_ended',
        targetType: 'representative_profile',
        targetId: profile._id.toString(),
        details: {
          profileId: profile._id.toString(),
          displayName: profile.displayName,
          role: profile.role,
          officeId: profile.officeId?.toString(),
          termEnd: profile.termEnd,
          previousStatus: prevStatus,
        },
      });

      // If profile is associated with a representative_office, suspend staff accounts pending admin review
      if (profile.officeId) {
        const staffUsers = await User.find({
          'officeMemberships.officeId': profile.officeId,
        });

        for (const user of staffUsers) {
          let updatedMembership = false;
          for (const m of user.officeMemberships) {
            if (m.officeId.toString() === profile.officeId.toString() && m.status === 'active') {
              m.status = 'revoked';
              updatedMembership = true;
            }
          }

          if (updatedMembership) {
            // Check if user has any other active memberships
            const hasOtherActive = user.officeMemberships.some((m) => m.status === 'active');
            if (!hasOtherActive && user.role === 'official') {
              user.status = 'suspended';
            }
            await user.save();
            suspendedStaffCount++;

            await AuditService.log({
              action: 'staff_membership_suspended_term_end',
              targetType: 'user',
              targetId: user._id.toString(),
              details: {
                userId: user._id.toString(),
                officeId: profile.officeId.toString(),
                representativeProfileId: profile._id.toString(),
              },
            });
          }
        }
      }

      expiredProfiles.push({
        profileId: profile._id.toString(),
        displayName: profile.displayName,
        role: profile.role,
        officeId: profile.officeId?.toString(),
      });
    }

    return {
      checkedCount: expiredCandidates.length,
      expiredProfilesCount: expiredProfiles.length,
      suspendedStaffCount,
      expiredProfiles,
    };
  }

  /**
   * Starts daily nightly job for representative term expiration
   */
  static startScheduler(intervalMs = 24 * 60 * 60 * 1000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(async () => {
      try {
        await this.runTermExpiryCheck();
      } catch (err) {
        console.error('[REP-TERM-SCHEDULER] Error during periodic term expiry check:', err);
      }
    }, intervalMs);

    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  static stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
