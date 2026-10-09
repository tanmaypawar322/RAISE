import bcrypt from 'bcryptjs';
import commonPasswords from '../data/common-passwords.json';

// Precomputed bcrypt cost 12 hash of a dummy string for constant-time comparison on non-existent accounts
const DUMMY_BCRYPT_HASH = '$2a$12$e8kP8yD6Y1/oFfJ78sU2Q.9W1f3Vb4N5M6k7L8j9H0g1F2d3S4a5Z';

export interface PasswordValidationResult {
  valid: boolean;
  reason?: string;
}

export class PasswordUtil {
  /**
   * Validates password against pilot security policy:
   * 1. Minimum 10 characters, maximum 128 characters.
   * 2. Rejects common passwords list.
   * 3. No forced uppercase/symbol rules (NIST SP 800-63B).
   */
  static validate(password: string): PasswordValidationResult {
    if (!password || typeof password !== 'string') {
      return { valid: false, reason: 'Password is required' };
    }
    if (password.length < 10) {
      return { valid: false, reason: 'Password must be at least 10 characters long' };
    }
    if (password.length > 128) {
      return { valid: false, reason: 'Password must not exceed 128 characters' };
    }

    const lower = password.toLowerCase();
    if (commonPasswords.includes(lower)) {
      return {
        valid: false,
        reason: 'This password is too common and easily guessed. Please choose a more unique password.',
      };
    }

    return { valid: true };
  }

  /**
   * Hashes password using bcrypt with cost factor 12.
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compares password with hash.
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Runs dummy comparison on unknown account lookups so response time
   * does not reveal whether the email exists.
   */
  static async dummyCompare(password: string): Promise<boolean> {
    return bcrypt.compare(password, DUMMY_BCRYPT_HASH);
  }
}
