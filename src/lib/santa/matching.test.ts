import { describe, it, expect } from "vitest";
import { match, type MatchInput } from "./matching";
import { mulberry32 } from "./rng";

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

function run(overrides: Partial<MatchInput> & { seed?: number } = {}) {
  const { seed = 1, ...rest } = overrides;
  return match({
    participants: people(6),
    exclusions: [],
    noMutualPairs: false,
    rng: mulberry32(seed),
    ...rest,
  });
}

function receiverOf(pairs: [string, string][], giver: string) {
  return pairs.find(([g]) => g === giver)?.[1];
}

describe("match", () => {
  it("assigns every participant exactly one receiver and is never a self-draw (200 seeds)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const res = run({ seed });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.pairs).toHaveLength(6);
      const givers = res.pairs.map(([g]) => g).sort();
      const receivers = res.pairs.map(([, r]) => r).sort();
      expect(givers).toEqual(people(6).sort());
      expect(receivers).toEqual(people(6).sort());
      for (const [g, r] of res.pairs) expect(g).not.toBe(r);
    }
  });

  it("never pairs excluded participants in either direction", () => {
    const exclusions: [string, string][] = [
      ["p0", "p1"],
      ["p2", "p3"],
    ];
    for (let seed = 0; seed < 100; seed++) {
      const res = run({ seed, exclusions });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      for (const [a, b] of exclusions) {
        expect(receiverOf(res.pairs, a)).not.toBe(b);
        expect(receiverOf(res.pairs, b)).not.toBe(a);
      }
    }
  });

  it("forbids mutual pairs when noMutualPairs is on", () => {
    for (let seed = 0; seed < 100; seed++) {
      const res = run({ seed, participants: people(4), noMutualPairs: true });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      for (const [g, r] of res.pairs) {
        expect(receiverOf(res.pairs, r)).not.toBe(g);
      }
    }
  });

  it("allows mutual pairs when noMutualPairs is off (some seed produces one)", () => {
    let sawMutual = false;
    for (let seed = 0; seed < 200 && !sawMutual; seed++) {
      const res = run({ seed, participants: people(4) });
      if (!res.ok) continue;
      sawMutual = res.pairs.some(([g, r]) => receiverOf(res.pairs, r) === g);
    }
    expect(sawMutual).toBe(true);
  });

  it("names the blocked participant when someone has no one they can draw", () => {
    const res = run({
      participants: people(3),
      exclusions: [
        ["p0", "p1"],
        ["p0", "p2"],
      ],
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.blockedId).toBe("p0");
    expect(res.reason).toContain("p0");
  });

  it("returns ok:false when the pre-check passes but no arrangement exists", () => {
    // p0 and p2 can each only give to p1 — two givers, one receiver.
    const res = run({
      participants: people(4),
      exclusions: [
        ["p0", "p2"],
        ["p0", "p3"],
        ["p2", "p3"],
      ],
    });
    expect(res.ok).toBe(false);
  });

  it("is deterministic for the same seed", () => {
    const a = run({ seed: 123, exclusions: [["p1", "p4"]] });
    const b = run({ seed: 123, exclusions: [["p1", "p4"]] });
    expect(a).toEqual(b);
  });

  it("varies across seeds", () => {
    const outputs = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const res = run({ seed });
      if (res.ok) outputs.add(JSON.stringify(res.pairs));
    }
    expect(outputs.size).toBeGreaterThan(1);
  });

  it("rejects n=2 with noMutualPairs on (a 2-cycle is a mutual pair)", () => {
    const res = run({ participants: people(2), noMutualPairs: true });
    expect(res.ok).toBe(false);
  });

  it("accepts n=2 with noMutualPairs off", () => {
    const res = run({ participants: people(2) });
    expect(res).toEqual({ ok: true, pairs: expect.arrayContaining([["p0", "p1"], ["p1", "p0"]]) });
  });

  it("rejects fewer than 2 participants", () => {
    expect(run({ participants: people(1) }).ok).toBe(false);
    expect(run({ participants: [] }).ok).toBe(false);
  });

  it("gives up within the step budget instead of hanging", () => {
    const res = run({ participants: people(25), maxSteps: 1 });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toMatch(/in time/i);
  });

  it("respects exclusions on the closing edge of the chain (noMutualPairs on)", () => {
    const exclusions: [string, string][] = [
      ["p0", "p2"],
      ["p1", "p3"],
    ];
    for (let seed = 0; seed < 100; seed++) {
      const res = run({ seed, participants: people(5), noMutualPairs: true, exclusions });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      for (const [a, b] of exclusions) {
        expect(receiverOf(res.pairs, a)).not.toBe(b);
        expect(receiverOf(res.pairs, b)).not.toBe(a);
      }
    }
  });

  it("reports no chain when someone has only one possible neighbour (noMutualPairs on)", () => {
    // p0 may only pair with p1, but a cycle needs two distinct neighbours.
    const res = run({
      participants: people(4),
      noMutualPairs: true,
      exclusions: [
        ["p0", "p2"],
        ["p0", "p3"],
      ],
    });
    expect(res.ok).toBe(false);
  });

  it("produces one big chain when noMutualPairs is on (single cycle covers everyone)", () => {
    const res = run({ participants: people(7), noMutualPairs: true, seed: 5 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const seen = new Set<string>();
    let cur = "p0";
    do {
      seen.add(cur);
      cur = receiverOf(res.pairs, cur)!;
    } while (cur !== "p0" && !seen.has(cur));
    expect(seen.size).toBe(7);
  });
});
