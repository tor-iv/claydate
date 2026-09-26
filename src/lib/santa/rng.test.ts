import { describe, it, expect } from "vitest";
import { mulberry32, randomSeed, shuffle } from "./rng";

describe("mulberry32", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("produces values in [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs across seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("randomSeed", () => {
  it("returns a non-negative integer", () => {
    const s = randomSeed();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
  });
});

describe("shuffle", () => {
  it("returns a permutation of the input without mutating it", () => {
    const input = ["a", "b", "c", "d", "e"];
    const out = shuffle(input, mulberry32(3));
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([...input].sort());
    expect(input).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("is deterministic for a given seed", () => {
    const input = ["a", "b", "c", "d", "e", "f"];
    expect(shuffle(input, mulberry32(9))).toEqual(shuffle(input, mulberry32(9)));
  });
});
