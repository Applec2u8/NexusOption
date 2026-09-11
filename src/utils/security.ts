import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

/**
 * UTILITY: Security Utilities
 * Handles password encryption (AES) and hashing (Legacy fallback).
 */

// Secret key for reversible encryption. 
// REAL PROD USE: Move this to import.meta.env.VITE_APP_SECRET
const SECRET_KEY = "meta_bridge_secure_vault_xyz_123";
const SALT_ROUNDS = 10;
const ENC_PREFIX = "enc:";

/**
 * Encrypts a plaintext password using AES.
 * Returns a string prefixed with 'enc:'
 */
export function encryptPassword(password: string): string {
  if (!password) return "";
  const encrypted = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
  return `${ENC_PREFIX}${encrypted}`;
}

/**
 * Decrypts an AES encrypted password.
 * Only works if prefixed with 'enc:'. 
 * Otherwise returns the input (for hashes) or handles legacy plaintext.
 */
export function decryptPassword(encrypted: string): string {
  if (!encrypted || !encrypted.startsWith(ENC_PREFIX)) return encrypted;
  
  try {
    const rawCipher = encrypted.substring(ENC_PREFIX.length);
    const bytes = CryptoJS.AES.decrypt(rawCipher, SECRET_KEY);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext || encrypted;
  } catch (e) {
    console.error("[Security] Decryption failed:", e);
    return encrypted;
  }
}

/**
 * Legacy: Hashes a plaintext password (used for migration fallback).
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plaintext password with a stored password (Encrypted, Hashed, or Plain).
 */
export async function comparePassword(password: string, stored: string): Promise<boolean> {
  if (!password || !stored) return false;

  // 1. Try Encryption (Method 2)
  if (stored.startsWith(ENC_PREFIX)) {
    return decryptPassword(stored) === password;
  }

  // 2. Try Hashing (Legacy fallback)
  if (isHashed(stored)) {
    return bcrypt.compare(password, stored);
  }

  // 3. Try Plaintext (Legacy legacy fallback)
  return password === stored;
}

/**
 * Checks if a string looks like a bcrypt hash.
 */
export function isHashed(str: string): boolean {
  return typeof str === 'string' && /^\$2[ayb]\$.{56}$/.test(str);
}
