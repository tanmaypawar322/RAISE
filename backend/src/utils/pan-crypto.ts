import crypto from 'crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

function getKey(): Buffer {
  // Derive a deterministic 32-byte key from panEncKey using SHA-256
  return crypto.createHash('sha256').update(config.panEncKey).digest();
}

/**
 * Encrypts an Indian PAN using AES-256-GCM.
 * Stored format: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encryptPan(pan: string): string {
  const normalized = pan.trim().toUpperCase();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(normalized, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a stored PAN string
 */
export function decryptPan(encryptedString: string): string {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted PAN format.');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masks a PAN so that only the last 4 characters are visible (e.g. ••••••4321)
 */
export function maskPan(pan: string): string {
  const clean = pan.trim();
  if (clean.length < 4) return '••••';
  const visible = clean.substring(clean.length - 4);
  return '••••••' + visible;
}
