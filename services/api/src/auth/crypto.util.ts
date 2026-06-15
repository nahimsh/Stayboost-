import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import * as bcrypt from "bcryptjs";

const BCRYPT_COST = 12;
const TOKEN_BYTES = 32;

/** Hash a password with bcrypt (cost 12). */
export function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

/** Constant-time password verification. Returns false for users without a password. */
export async function verifyPassword(plaintext: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plaintext, hash);
}

/** A URL-safe random token to email to the user (never stored in plaintext). */
export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** SHA-256 of a token — what we store and look up by, so a DB leak exposes no usable token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time string comparison (avoids leaking length/content via timing). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
