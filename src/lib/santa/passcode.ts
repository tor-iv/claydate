import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const PASSCODE_RE = /^\d{4,6}$/;
const KEY_LEN = 32;

export function isValidPasscode(code: string): boolean {
  return PASSCODE_RE.test(code);
}

function scryptAsync(code: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(code, salt, KEY_LEN, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Returns "saltHex:hashHex". */
export async function hashPasscode(code: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(code, salt);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPasscode(code: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LEN) return false;
  const actual = await scryptAsync(code, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(actual, expected);
}

// ── Lockout policy ──────────────────────────────────────────────────────────
// In-memory per participant. One Node process serves the whole family, so a
// Map is enough; a restart clears it, which is acceptable for this scale.

export const LOCKOUT = { maxAttempts: 5, lockMs: 5 * 60 * 1000 };

type Attempts = { count: number; lockedUntil: number };
const attempts = new Map<string, Attempts>();

/**
 * ✍️ TODO(Tor): lockout policy (learning spot 2).
 *
 * Call order in loginAction: `isLocked(id)` first (bail if true), then
 * `registerFailedAttempt(id)` for EVERY attempt before the passcode is
 * verified (so a burst of parallel guesses is counted before any of them
 * finishes), then `clearAttempts(id)` only on success. The organizer's
 * reset also calls clearAttempts.
 *
 * Decide: does the counter reset when the lock expires, or keep climbing?
 * Does a lock extend if they keep trying while locked? Should it be per name
 * (a sibling guessing your code) or per IP (needs the request; not wired)?
 * The tests in passcode.test.ts pin the minimum: LOCKOUT.maxAttempts
 * failures lock for LOCKOUT.lockMs (they count from the Nth failure; you
 * may choose "from the last failure" instead, the tests allow both),
 * participants are independent, and clearAttempts unlocks. `attempts` is
 * the Map to use.
 */
export function registerFailedAttempt(id: string, now: number = Date.now()): void {
  void id; void now; void attempts;
}

export function isLocked(id: string, now: number = Date.now()): boolean {
  void id; void now;
  return false;
}

export function clearAttempts(id: string): void {
  attempts.delete(id);
}
