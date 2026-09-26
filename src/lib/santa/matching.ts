import { shuffle } from "./rng";

export type MatchInput = {
  /** Participant ids. */
  participants: string[];
  /** Symmetric pairs who must not draw each other (either direction). */
  exclusions: [string, string][];
  /** When true, produce one big gift chain (single cycle) so no A↔B swaps exist. */
  noMutualPairs: boolean;
  /** Random source in [0, 1). Seeded in tests, crypto-seeded for real draws. */
  rng: () => number;
  /** Backtracking budget; defaults to 1e6 node visits. */
  maxSteps?: number;
};

export type MatchResult =
  | { ok: true; pairs: [giver: string, receiver: string][] }
  | { ok: false; reason: string; blockedId?: string };

const DEFAULT_MAX_STEPS = 1_000_000;

/** Map each participant to the set of people they are allowed to draw. */
export function buildAllowed(
  participants: string[],
  exclusions: [string, string][],
): Map<string, Set<string>> {
  const allowed = new Map<string, Set<string>>();
  for (const p of participants) {
    allowed.set(p, new Set(participants.filter((q) => q !== p)));
  }
  for (const [a, b] of exclusions) {
    allowed.get(a)?.delete(b);
    allowed.get(b)?.delete(a);
  }
  return allowed;
}

export function match(input: MatchInput): MatchResult {
  const { participants, exclusions, noMutualPairs, rng } = input;
  const n = participants.length;

  const minPeople = noMutualPairs ? 3 : 2;
  if (n < minPeople) {
    return {
      ok: false,
      reason: noMutualPairs
        ? "one big gift chain needs at least 3 people"
        : "need at least 2 people to draw",
    };
  }

  const allowed = buildAllowed(participants, exclusions);
  for (const p of participants) {
    if (allowed.get(p)!.size === 0) {
      return { ok: false, reason: `${p} has no one they can draw`, blockedId: p };
    }
  }

  const budget = { steps: input.maxSteps ?? DEFAULT_MAX_STEPS };
  const chosen = noMutualPairs
    ? search(
        n,
        // slot 0 is fixed to participants[0]; each later slot must be drawable by the previous one
        (i, path) => (i === 0 ? [participants[0]] : [...allowed.get(path[i - 1])!]),
        // the chain must close: last person can give to the first
        (path) => allowed.get(path[n - 1])!.has(path[0]),
        rng,
        budget,
      )
    : search(
        n,
        // slot i is the receiver for participants[i]
        (i) => [...allowed.get(participants[i])!],
        () => true,
        rng,
        budget,
      );

  if (!chosen) {
    return {
      ok: false,
      reason:
        budget.steps <= 0
          ? "couldn't find a valid arrangement in time — loosen the exclusions"
          : "no valid arrangement exists with these exclusions — loosen them",
    };
  }

  const pairs: [string, string][] = noMutualPairs
    ? chosen.map((giver, i) => [giver, chosen[(i + 1) % n]])
    : participants.map((giver, i) => [giver, chosen[i]]);
  return { ok: true, pairs };
}

/**
 * ✍️ TODO(Tor): the randomized backtracking search.
 *
 * Fill `slots` positions in order. For slot `i`, `candidatesFor(i, chosen)`
 * lists every id that could legally go there given what's already chosen
 * (`chosen` holds slots 0..i-1). You must also skip any candidate already
 * used in an earlier slot (each person appears exactly once). When all
 * slots are filled, `acceptFinal(chosen)` gets the last word (the cycle
 * mode uses it to check the chain closes). Return the completed array, or
 * null if no arrangement exists.
 *
 * Randomness: shuffle the candidates with `shuffle(candidates, rng)` before
 * trying them so every draw is different and the same seed replays.
 *
 * Budget: decrement `budget.steps` once per candidate you place into a
 * slot. When it reaches 0, every pending recursion level must return null
 * immediately (don't keep trying siblings), so a nasty exclusion graph
 * never hangs a Server Action. `match()` reads `budget.steps <= 0` to word
 * the error as "in time" rather than "no arrangement exists".
 *
 * Trade-off you are choosing: backtracking proves "impossible" vs "unlucky";
 * rejection sampling (shuffle N times) is shorter but can't tell them apart,
 * and the organizer's error message needs to know.
 */
function search(
  slots: number,
  candidatesFor: (i: number, chosen: string[]) => string[],
  acceptFinal: (chosen: string[]) => boolean,
  rng: () => number,
  budget: { steps: number },
): string[] | null {
  void slots; void candidatesFor; void acceptFinal; void rng; void budget; void shuffle;
  throw new Error("✍️ TODO(Tor): implement search() in src/lib/matching.ts");
}
