import crypto from 'crypto';

/**
 * Normalizes input to E.164 Indian mobile number format (+91XXXXXXXXXX).
 * Validates 10-digit mobile numbers starting with 6, 7, 8, or 9.
 */
export function normalizeIndianPhone(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Phone number is required.');
  }

  // Remove whitespace, dashes, parentheses
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0091')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  const digitsOnly = cleaned.replace(/\D/g, '');

  if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
    throw new Error('Please provide a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
  }

  return `+91${digitsOnly}`;
}

/**
 * Masks phone number for privacy in profile displays (e.g. +91 ******3210).
 */
export function maskPhone(e164Phone: string): string {
  try {
    const norm = normalizeIndianPhone(e164Phone);
    const last4 = norm.slice(-4);
    return `+91 ******${last4}`;
  } catch {
    const digits = e164Phone.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return `+91 ******${last4 || '0000'}`;
  }
}

/**
 * Computes deterministic HMAC-SHA256 hash for phone indexing and lookups.
 */
export function hashPhone(e164Phone: string, secret: string): string {
  const norm = normalizeIndianPhone(e164Phone);
  return crypto.createHmac('sha256', secret).update(norm).digest('hex');
}

/**
 * Computes HMAC-SHA256 hash for storing OTP securely.
 */
export function hashOtp(e164Phone: string, otp: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${e164Phone}:${otp}`).digest('hex');
}

/**
 * Derives a 32-byte Buffer from a secret key string or hex.
 */
function getEncryptionKeyBuffer(keyInput: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(keyInput)) {
    return Buffer.from(keyInput, 'hex');
  }
  return crypto.createHash('sha256').update(keyInput).digest();
}

/**
 * Encrypts phone number using AES-256-GCM with a random 12-byte IV.
 * Returns `${ivHex}:${authTagHex}:${ciphertextHex}`.
 */
export function encryptPhone(e164Phone: string, secretKey: string): string {
  const key = getEncryptionKeyBuffer(secretKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(e164Phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts phone number from AES-256-GCM format.
 */
export function decryptPhone(payload: string, secretKey: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted phone payload format');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = getEncryptionKeyBuffer(secretKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
