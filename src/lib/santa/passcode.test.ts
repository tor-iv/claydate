import { describe, it, expect, beforeEach } from "vitest";
import {
  isValidPasscode,
  hashPasscode,
  verifyPasscode,
  registerFailedAttempt,
  isLocked,
  clearAttempts,
  LOCKOUT,
} from "./passcode";

describe("isValidPasscode", () => {
  it("accepts 4 to 6 digits", () => {
    expect(isValidPasscode("1234")).toBe(true);
    expect(isValidPasscode("123456")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isValidPasscode("123")).toBe(false);
    expect(isValidPasscode("1234567")).toBe(false);
    expect(isValidPasscode("12a4")).toBe(false);
    expect(isValidPasscode(" 1234")).toBe(false);
  });
});

describe("hashPasscode / verifyPasscode", () => {
  it("verifies the right passcode and rejects the wrong one", async () => {
    const stored = await hashPasscode("4321");
    expect(stored).not.toContain("4321");
    expect(await verifyPasscode("4321", stored)).toBe(true);
    expect(await verifyPasscode("4322", stored)).toBe(false);
  });

  it("salts, so the same passcode hashes differently twice", async () => {
    expect(await hashPasscode("1111")).not.toBe(await hashPasscode("1111"));
  });

  it("rejects a malformed stored value instead of throwing", async () => {
    expect(await verifyPasscode("1111", "garbage")).toBe(false);
  });
});

describe("lockout policy", () => {
  const id = "p-test";
  const t0 = 1_000_000;
  beforeEach(() => clearAttempts(id));

  it("is not locked before the attempt limit", () => {
    for (let i = 0; i < LOCKOUT.maxAttempts - 1; i++) registerFailedAttempt(id, t0);
    expect(isLocked(id, t0)).toBe(false);
  });

  it("locks once the attempt limit is hit", () => {
    for (let i = 0; i < LOCKOUT.maxAttempts; i++) registerFailedAttempt(id, t0);
    expect(isLocked(id, t0)).toBe(true);
  });

  it("unlocks after the lock duration passes", () => {
    for (let i = 0; i < LOCKOUT.maxAttempts; i++) registerFailedAttempt(id, t0);
    expect(isLocked(id, t0 + LOCKOUT.lockMs - 1)).toBe(true);
    expect(isLocked(id, t0 + LOCKOUT.lockMs)).toBe(false);
  });

  it("clearAttempts resets a locked participant", () => {
    for (let i = 0; i < LOCKOUT.maxAttempts; i++) registerFailedAttempt(id, t0);
    clearAttempts(id);
    expect(isLocked(id, t0)).toBe(false);
  });

  it("tracks participants independently", () => {
    for (let i = 0; i < LOCKOUT.maxAttempts; i++) registerFailedAttempt(id, t0);
    expect(isLocked("someone-else", t0)).toBe(false);
  });
});
