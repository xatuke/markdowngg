/**
 * Zero-knowledge encryption utilities
 * Uses AES-GCM for encryption with keys stored in URL fragments
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Export key to base64 string for URL storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

/**
 * Import key from base64 string
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyString);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext using the provided key
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return as base64
  return arrayBufferToBase64(combined);
}

/**
 * Decrypt ciphertext using the provided key
 */
export async function decrypt(
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  const combined = base64ToArrayBuffer(ciphertext);

  // Extract IV and encrypted data
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encrypted
  );

  // Decode
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Generate a random document ID
 */
export function generateId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a random write token for document updates
 * Returns a URL-safe base64 string
 */
export function generateWriteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  return arrayBufferToBase64(bytes.buffer);
}

/**
 * Hash a write token for server-side storage
 * Uses SHA-256 for simplicity (in production, consider bcrypt/argon2)
 */
export async function hashWriteToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Verify a write token against its hash
 */
export async function verifyWriteToken(
  token: string,
  hash: string
): Promise<boolean> {
  const computedHash = await hashWriteToken(token);
  return computedHash === hash;
}

/**
 * Helper: Convert ArrayBuffer to base64 string (URL-safe)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Helper: Convert base64 string to ArrayBuffer (URL-safe)
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Convert URL-safe base64 to standard base64
  const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  const padding = "=".repeat((4 - (standardBase64.length % 4)) % 4);
  const paddedBase64 = standardBase64 + padding;

  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
