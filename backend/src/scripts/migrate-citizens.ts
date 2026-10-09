import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { OtpService } from '../services/otp.service.js';

/**
 * Migration Script: Migrate existing citizen records to the Phase 2 schema.
 * 
 * Safely updates existing records:
 * - Ensures status: 'active' for existing users.
 * - Sets default tokenVersion: 0.
 * - Backfills phoneEnc and phoneHash if legacy phone string is present.
 * - Leaves accounts without phone intact so citizens can link a phone via OTP on subsequent login.
 * 
 * Usage:
 *   npx tsx src/scripts/migrate-citizens.ts
 */
async function migrateCitizens() {
  console.log('[Migration] Connecting to database...');
  await mongoose.connect(config.mongoUri);
  console.log('[Migration] Connected.');

  try {
    const users = await User.find({});
    console.log(`[Migration] Scanning ${users.length} user records...`);

    let updatedCount = 0;

    for (const user of users) {
      let changed = false;

      // 1. Ensure status field
      if (!user.status) {
        user.status = user.role === 'admin' || user.role === 'citizen' ? 'active' : 'pending';
        changed = true;
      }

      // 2. Ensure tokenVersion field
      if (user.tokenVersion === undefined || user.tokenVersion === null) {
        user.tokenVersion = 0;
        changed = true;
      }

      // 3. Ensure isProfileComplete
      if (user.isProfileComplete === undefined || user.isProfileComplete === null) {
        // If legacy user already has name and ward, mark completed
        user.isProfileComplete = Boolean(user.displayName && (user.homeWard || user.homeArea?.ward));
        changed = true;
      }

      // 4. Migrate any plaintext phone if present and phoneEnc is missing
      const legacyPhone = (user as any).phone;
      if (legacyPhone && !user.phoneEnc) {
        try {
          const norm = OtpService.normalizePhone(legacyPhone);
          user.phoneEnc = OtpService.encryptPhone(norm);
          user.phoneHash = OtpService.hashPhone(norm);
          user.phoneMasked = OtpService.maskPhone(norm);
          changed = true;
        } catch {
          // If legacy phone was malformed, skip phone migration for this record
        }
      }

      if (changed) {
        await user.save();
        updatedCount++;
      }
    }

    console.log(`[Migration] Completed successfully. Updated ${updatedCount} records.`);
  } catch (err: any) {
    console.error('[Migration] Failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Migration] Disconnected from database.');
  }
}

migrateCitizens();
