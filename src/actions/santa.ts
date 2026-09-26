"use server";

import { redirect } from "next/navigation";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { santaAssignments, santaExchange, santaExclusions, santaParticipants, santaWishItems, users } from "@/db/schema";
import { getSession, canEdit } from "@/lib/session";
import { SANTA_LIMITS, SANTA_UNSEAL_CONFIRMATION } from "@/lib/constants";
import { requireSantaOrganizer, requireSantaUser } from "@/lib/santa/authz";
import { santaAudit } from "@/lib/santa/audit";
import { getSantaExchange, sessionKeyFor } from "@/lib/santa/queries";
import { match } from "@/lib/santa/matching";
import { mulberry32, randomSeed } from "@/lib/santa/rng";
import { isValidDeadline, normalizeExclusion } from "@/lib/santa/rules";
import {
  clearAttempts,
  hashPasscode,
  isLocked,
  isValidPasscode,
  registerFailedAttempt,
  verifyPasscode,
} from "@/lib/santa/passcode";

function go(path: string, error?: string, notice?: string): never {
  const params = new URLSearchParams();
  if (error) params.set("error", error);
  if (notice) params.set("notice", notice);
  redirect(params.size ? `${path}?${params}` : path);
}
// Function declarations with an explicit `never` so TypeScript narrows after each call.
function home(error?: string, notice?: string): never {
  go("/santa", error, notice);
}
function mine(error?: string, notice?: string): never {
  go("/santa/me", error, notice);
}
function organize(error?: string, notice?: string): never {
  go("/santa/organize", error, notice);
}

/** Roster and exclusion edits are only allowed before a draw or after an unseal. */
function assertEditable(): void {
  if (getSantaExchange().draw_status === "drawn") {
    organize("the draw already happened — unseal or re-draw before changing people or exclusions");
  }
}

// ── Joining ─────────────────────────────────────────────────────────────────

export async function joinSantaAction(): Promise<void> {
  const ctx = await requireSantaUser();
  if (!canEdit(ctx.role)) home("guests can watch but not join — ask for the friend password");
  if (getSantaExchange().draw_status === "drawn") home("the draw already happened — ask the organizer to add you");
  await db.insert(santaParticipants).values({ user_id: ctx.user.id, joined_at: Date.now() }).onConflictDoNothing();
  await santaAudit(ctx.user.id, "joined");
  home(undefined, "you're in! add a few wish list ideas.");
}

export async function leaveSantaAction(): Promise<void> {
  const ctx = await requireSantaUser();
  if (getSantaExchange().draw_status === "drawn") home("too late to leave — the draw already happened");
  await db.delete(santaParticipants).where(eq(santaParticipants.user_id, ctx.user.id));
  await santaAudit(ctx.user.id, "left");
  home(undefined, "you're out. come back any time before the draw.");
}

// ── Reveal PIN ──────────────────────────────────────────────────────────────
// ClayDate's login is a shared password, so anyone can log in as anyone. The
// PIN is what keeps *your* match yours.

async function unlock(userId: string, pinHash: string): Promise<void> {
  const session = await getSession();
  session.santaKey = sessionKeyFor(pinHash);
  await session.save();
  await db
    .update(santaAssignments)
    .set({ revealed_at: sql`COALESCE(${santaAssignments.revealed_at}, ${Date.now()})` })
    .where(eq(santaAssignments.giver_id, userId));
}

export async function setRevealPinAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaUser();
  if (!ctx.participant) home("you're not in the exchange");
  const pin = (formData.get("pin") ?? "").toString();
  const confirm = (formData.get("confirm") ?? "").toString();
  if (!isValidPasscode(pin)) home("your pin must be 4 to 6 digits");
  if (pin !== confirm) home("those two pins don't match");
  const hash = await hashPasscode(pin);
  const res = await db
    .update(santaParticipants)
    .set({ reveal_pin_hash: hash })
    .where(and(eq(santaParticipants.user_id, ctx.user.id), sql`${santaParticipants.reveal_pin_hash} IS NULL`));
  if (res.changes !== 1) home("a pin was already set — enter it instead");
  await unlock(ctx.user.id, hash);
  home();
}

export async function unlockRevealAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaUser();
  const p = ctx.participant;
  if (!p?.reveal_pin_hash) home("set a pin first");
  if (isLocked(ctx.user.id)) home("too many tries — wait a few minutes");
  registerFailedAttempt(ctx.user.id);
  const pin = (formData.get("pin") ?? "").toString();
  const ok = isValidPasscode(pin) && (await verifyPasscode(pin, p.reveal_pin_hash));
  if (!ok) home("that's not your pin");
  clearAttempts(ctx.user.id);
  await unlock(ctx.user.id, p.reveal_pin_hash);
  home();
}

export async function hideRevealAction(): Promise<void> {
  const session = await getSession();
  session.santaKey = undefined;
  await session.save();
  home();
}

// ── Wish list ───────────────────────────────────────────────────────────────

function cleanUrl(raw: string): string | null | "bad" {
  const s = raw.trim();
  if (!s) return null;
  if (s.length > SANTA_LIMITS.wishUrl) return "bad";
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "bad";
  } catch {
    return "bad";
  }
}

export async function addWishItemAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaUser();
  if (!canEdit(ctx.role)) mine("guests can't keep a list");
  const title = (formData.get("title") ?? "").toString().trim();
  const url = cleanUrl((formData.get("url") ?? "").toString());
  const price = (formData.get("price") ?? "").toString().trim();
  if (!title) mine("what is it? give it a name");
  if (title.length > SANTA_LIMITS.wishTitle) mine("keep the name a bit shorter");
  if (url === "bad") mine("that link doesn't look right");
  if (price.length > SANTA_LIMITS.wishPrice) mine("keep the price note short");

  const existing = await db.select({ position: santaWishItems.position }).from(santaWishItems).where(eq(santaWishItems.user_id, ctx.user.id));
  const position = existing.reduce((m, r) => Math.max(m, r.position), 0) + 1;
  await db.insert(santaWishItems).values({
    id: nanoid(),
    user_id: ctx.user.id,
    title,
    url,
    price_note: price || null,
    position,
    created_at: Date.now(),
  });
  mine();
}

export async function removeWishItemAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaUser();
  const id = (formData.get("id") ?? "").toString();
  await db.delete(santaWishItems).where(and(eq(santaWishItems.id, id), eq(santaWishItems.user_id, ctx.user.id)));
  mine();
}

export async function moveWishItemAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaUser();
  const id = (formData.get("id") ?? "").toString();
  const dir = (formData.get("dir") ?? "").toString() === "up" ? -1 : 1;
  const items = await db.select().from(santaWishItems).where(eq(santaWishItems.user_id, ctx.user.id)).orderBy(asc(santaWishItems.position));
  const idx = items.findIndex((i) => i.id === id);
  const swapIdx = idx + dir;
  if (idx === -1 || swapIdx < 0 || swapIdx >= items.length) mine();
  const a = items[idx];
  const b = items[swapIdx];
  db.transaction((tx) => {
    tx.update(santaWishItems).set({ position: b.position }).where(eq(santaWishItems.id, a.id)).run();
    tx.update(santaWishItems).set({ position: a.position }).where(eq(santaWishItems.id, b.id)).run();
  });
  mine();
}

// ── Organizer: settings ─────────────────────────────────────────────────────

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaOrganizer();
  const budget = (formData.get("budget") ?? "").toString().trim();
  const deadline = (formData.get("deadline") ?? "").toString().trim();
  const houseRules = (formData.get("houseRules") ?? "").toString().trim();
  const noMutual = formData.get("noMutual") === "on";
  if (budget.length > SANTA_LIMITS.budget) organize("keep the budget note short");
  if (deadline && !isValidDeadline(deadline)) organize("deadline must be a real date (YYYY-MM-DD)");
  if (houseRules.length > SANTA_LIMITS.houseRules) organize("house rules are a bit long");

  const ex = getSantaExchange();
  // The chain rule is fixed once drawn (the checkbox is disabled, so it isn't posted).
  const chain = ex.draw_status === "drawn" ? ex.no_mutual_pairs : noMutual;
  await db
    .update(santaExchange)
    .set({ budget_text: budget || null, deadline_date: deadline || null, house_rules: houseRules || null, no_mutual_pairs: chain })
    .where(eq(santaExchange.id, "singleton"));
  await santaAudit(ctx.user.id, "settings_saved", { budget, deadline, noMutual: chain });
  organize(undefined, "rules saved");
}

// ── Organizer: roster ───────────────────────────────────────────────────────

export async function addParticipantAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaOrganizer();
  assertEditable();
  const userId = (formData.get("userId") ?? "").toString();
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) organize("pick someone from the list");
  await db.insert(santaParticipants).values({ user_id: user.id, joined_at: Date.now() }).onConflictDoNothing();
  await santaAudit(ctx.user.id, "participant_added", { name: user.name });
  organize(undefined, `${user.name} is in`);
}

export async function removeParticipantAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaOrganizer();
  assertEditable();
  const userId = (formData.get("userId") ?? "").toString();
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) organize();
  await db.delete(santaParticipants).where(eq(santaParticipants.user_id, userId));
  await santaAudit(ctx.user.id, "participant_removed", { name: user.name });
  organize(undefined, `${user.name} is out`);
}

export async function resetPinAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaOrganizer();
  const userId = (formData.get("userId") ?? "").toString();
  await db.update(santaParticipants).set({ reveal_pin_hash: null }).where(eq(santaParticipants.user_id, userId));
  clearAttempts(userId);
  await santaAudit(ctx.user.id, "pin_reset", { userId });
  organize(undefined, "pin cleared — they can set a new one");
}

// ── Organizer: exclusions ───────────────────────────────────────────────────

function nameOf(id: string): string {
  return db.select({ name: users.name }).from(users).where(eq(users.id, id)).get()?.name ?? id;
}

export async function addExclusionAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaOrganizer();
  assertEditable();
  const pair = normalizeExclusion((formData.get("a") ?? "").toString(), (formData.get("b") ?? "").toString());
  const note = (formData.get("note") ?? "").toString().trim();
  if (!pair) organize("pick two different people");
  if (note.length > SANTA_LIMITS.note) organize("keep the note short");
  try {
    await db.insert(santaExclusions).values({ a_id: pair[0], b_id: pair[1], note: note || null });
  } catch {
    organize("that pair is already excluded (or one of them isn't in the exchange)");
  }
  await santaAudit(ctx.user.id, "exclusion_added", { pair: [nameOf(pair[0]), nameOf(pair[1])], note });
  organize(undefined, "exclusion added");
}

export async function removeExclusionAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaOrganizer();
  assertEditable();
  const a = (formData.get("a") ?? "").toString();
  const b = (formData.get("b") ?? "").toString();
  await db.delete(santaExclusions).where(and(eq(santaExclusions.a_id, a), eq(santaExclusions.b_id, b)));
  await santaAudit(ctx.user.id, "exclusion_removed", { pair: [nameOf(a), nameOf(b)] });
  organize(undefined, "exclusion removed");
}

// ── Organizer: the draw ─────────────────────────────────────────────────────

function loadMatchInput() {
  const people = db.select({ id: santaParticipants.user_id }).from(santaParticipants).all();
  const ex = db.select({ a: santaExclusions.a_id, b: santaExclusions.b_id }).from(santaExclusions).all();
  return {
    participants: people.map((p) => p.id),
    exclusions: ex.map((e) => [e.a, e.b] as [string, string]),
    noMutualPairs: getSantaExchange().no_mutual_pairs,
  };
}

function humanReason(res: { reason: string; blockedId?: string }): string {
  return res.blockedId ? res.reason.replace(res.blockedId, nameOf(res.blockedId)) : res.reason;
}

export async function checkDrawAction(): Promise<void> {
  await requireSantaOrganizer();
  const input = loadMatchInput();
  const res = match({ ...input, rng: mulberry32(randomSeed()) });
  if (res.ok) organize(undefined, `looks good — ${input.participants.length} people, a valid draw exists`);
  organize(humanReason(res));
}

type DrawOutcome = { ok: true; count: number } | { ok: false; reason: string };

/** Never redirects: redirect() throws, and a throw inside a try would be swallowed. */
function writeDraw(expectStatus: Array<"none" | "drawn" | "unsealed">): DrawOutcome {
  const res = match({ ...loadMatchInput(), rng: mulberry32(randomSeed()) });
  if (!res.ok) return { ok: false, reason: humanReason(res) };
  const now = Date.now();
  try {
    db.transaction((tx) => {
      const ex = tx.select().from(santaExchange).where(eq(santaExchange.id, "singleton")).get();
      if (!ex || !expectStatus.includes(ex.draw_status)) throw new Error("draw state changed");
      tx.delete(santaAssignments).run();
      tx.insert(santaAssignments).values(res.pairs.map(([giver_id, receiver_id]) => ({ giver_id, receiver_id, revealed_at: null }))).run();
      tx.update(santaExchange).set({ draw_status: "drawn", drawn_at: now, unsealed_at: null }).where(eq(santaExchange.id, "singleton")).run();
    });
  } catch {
    return { ok: false, reason: "the draw state changed under you — refresh and look again" };
  }
  return { ok: true, count: res.pairs.length };
}

export async function runDrawAction(): Promise<void> {
  const ctx = await requireSantaOrganizer();
  const out = writeDraw(["none"]);
  if (!out.ok) organize(out.reason);
  await santaAudit(ctx.user.id, "draw", { participants: out.count });
  organize(undefined, `drawn! ${out.count} people have a person. shh.`);
}

export async function redrawAction(): Promise<void> {
  const ctx = await requireSantaOrganizer();
  const ex = getSantaExchange();
  if (ex.draw_status === "none") organize("nothing to re-draw yet");
  const revealed = db.select({ c: sql<number>`count(*)` }).from(santaAssignments).where(isNotNull(santaAssignments.revealed_at)).get()?.c ?? 0;
  if (ex.draw_status === "drawn" && revealed > 0) {
    organize(`${revealed} ${revealed === 1 ? "person has" : "people have"} already looked — unseal first if you really must`);
  }
  const out = writeDraw(["drawn", "unsealed"]);
  if (!out.ok) organize(out.reason);
  await santaAudit(ctx.user.id, "redraw", { participants: out.count, previouslyRevealed: revealed });
  organize(undefined, `re-drawn. ${out.count} people have a new person.`);
}

export async function unsealAction(formData: FormData): Promise<void> {
  const ctx = await requireSantaOrganizer();
  const typed = (formData.get("confirm") ?? "").toString().trim();
  if (typed !== SANTA_UNSEAL_CONFIRMATION) organize(`type ${SANTA_UNSEAL_CONFIRMATION} to confirm`);
  if (getSantaExchange().draw_status !== "drawn") organize("nothing sealed right now");
  // Log before the pairs become visible so the record exists even if the redirect fails.
  await santaAudit(ctx.user.id, "unseal");
  await db.update(santaExchange).set({ draw_status: "unsealed", unsealed_at: Date.now() }).where(eq(santaExchange.id, "singleton"));
  organize(undefined, "unsealed. the pairs are below — this is logged.");
}
