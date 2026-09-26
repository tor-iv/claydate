import { describe, it, expect } from "vitest";
import { normalizeExclusion, isValidDeadline, formatDeadline } from "./rules";

describe("normalizeExclusion", () => {
  it("orders the pair so a < b regardless of input order", () => {
    expect(normalizeExclusion("zed", "amy")).toEqual(["amy", "zed"]);
    expect(normalizeExclusion("amy", "zed")).toEqual(["amy", "zed"]);
  });

  it("rejects a self-pair", () => {
    expect(normalizeExclusion("amy", "amy")).toBeNull();
  });
});

describe("isValidDeadline", () => {
  it("accepts a real YYYY-MM-DD date", () => {
    expect(isValidDeadline("2026-12-20")).toBe(true);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isValidDeadline("12/20/2026")).toBe(false);
    expect(isValidDeadline("2026-13-01")).toBe(false);
    expect(isValidDeadline("2026-02-30")).toBe(false);
    expect(isValidDeadline("")).toBe(false);
  });
});

describe("formatDeadline", () => {
  it("formats without shifting the day across timezones", () => {
    expect(formatDeadline("2026-12-20")).toBe("Sun, Dec 20");
    expect(formatDeadline("2026-01-01")).toBe("Thu, Jan 1");
  });
});
