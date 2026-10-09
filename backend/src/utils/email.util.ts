import crypto from 'crypto';
import disposableDomains from '../data/disposable-domains.json';

export class EmailUtil {
  /**
   * Normalizes an email address:
   * - Trims whitespace and lowercases.
   * - Canonicalizes googlemail.com to gmail.com.
   * - For gmail.com, strips dots in username and strips +tags.
   */
  static normalize(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Email address is required.');
    }

    const trimmed = email.trim().toLowerCase();
    const parts = trimmed.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid email address format.');
    }

    let [local, domain] = parts;

    if (domain === 'googlemail.com') {
      domain = 'gmail.com';
    }

    if (domain === 'gmail.com') {
      // Remove any +tag
      const plusIndex = local.indexOf('+');
      if (plusIndex !== -1) {
        local = local.slice(0, plusIndex);
      }
      // Remove all dots
      local = local.replace(/\./g, '');
    }

    return `${local}@${domain}`;
  }

  /**
   * Checks whether the email uses a known disposable/burner email service.
   */
  static isDisposable(email: string): boolean {
    try {
      const norm = this.normalize(email);
      const domain = norm.split('@')[1];
      return disposableDomains.includes(domain);
    } catch {
      return false;
    }
  }

  /**
   * Computes deterministic HMAC-SHA256 hash for email indexing and lookups.
   */
  static hash(email: string, secret: string): string {
    const norm = this.normalize(email);
    return crypto.createHmac('sha256', secret).update(norm).digest('hex');
  }

  /**
   * Masks email address for user privacy in profile displays (e.g. j***@gmail.com).
   */
  static mask(email: string): string {
    try {
      const norm = this.normalize(email);
      const [local, domain] = norm.split('@');
      if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
      }
      return `${local[0]}***${local[local.length - 1]}@${domain}`;
    } catch {
      return '***@***.***';
    }
  }

  /**
   * Derives a 32-byte Buffer from secretKey.
   */
  private static getKeyBuffer(keyInput: string): Buffer {
    if (/^[0-9a-fA-F]{64}$/.test(keyInput)) {
      return Buffer.from(keyInput, 'hex');
    }
    return crypto.createHash('sha256').update(keyInput).digest();
  }

  /**
   * Encrypts email using AES-256-GCM with a random 12-byte IV.
   * Returns `${ivHex}:${authTagHex}:${ciphertextHex}`.
   */
  static encrypt(email: string, secretKey: string): string {
    const norm = this.normalize(email);
    const key = this.getKeyBuffer(secretKey);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(norm, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts email from AES-256-GCM format.
   */
  static decrypt(payload: string, secretKey: string): string {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted email payload format');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = this.getKeyBuffer(secretKey);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
