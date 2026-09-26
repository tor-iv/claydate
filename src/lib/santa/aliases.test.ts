import { describe, it, expect } from "vitest";
import { ALIASES, pickAlias } from "./aliases";
import { mulberry32 } from "./rng";

describe("ALIASES", () => {
  it("has at least 10 entries, each complete", () => {
    expect(ALIASES.length).toBeGreaterThanOrEqual(10);
    for (const a of ALIASES) {
      expect(a.name.trim()).not.toBe("");
      expect(a.emoji.trim()).not.toBe("");
      expect(a.tagline.trim()).not.toBe("");
      expect(a.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("has unique names", () => {
    const names = ALIASES.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes the two headline aliases", () => {
    const names = ALIASES.map((a) => a.name);
    expect(names).toContain("Secret Santa");
    expect(names).toContain("Mysterious Moses");
  });

  it("every name is alliterative (both words share a first letter)", () => {
    for (const a of ALIASES) {
      const words = a.name.split(/[\s-]+/).filter(Boolean);
      const first = words[0][0].toLowerCase();
      const last = words[words.length - 1][0].toLowerCase();
      expect(first, a.name).toBe(last);
    }
  });
});

describe("pickAlias", () => {
  it("returns a member of ALIASES", () => {
    expect(ALIASES).toContain(pickAlias(mulberry32(4)));
  });

  it("is deterministic for a seed and varies across seeds", () => {
    expect(pickAlias(mulberry32(8))).toBe(pickAlias(mulberry32(8)));
    const seen = new Set<string>();
    for (let s = 0; s < 50; s++) seen.add(pickAlias(mulberry32(s)).name);
    expect(seen.size).toBeGreaterThan(3);
  });
});
