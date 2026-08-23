/**
 * src/utils/auth.ts
 * Simple client-side password hashing (SHA-256 via Web Crypto).
 *
 * This avoids storing plaintext passwords in localStorage, but it is still
 * NOT cryptographically safe against a determined attacker with access to
 * this device/browser (no salt rotation, no server, no rate limiting).
 * It exists to prevent casual mistakes, not to protect sensitive data.
 */

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
