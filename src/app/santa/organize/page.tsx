import { asc, count, eq, isNotNull, notInArray } from "drizzle-orm";
import { alias as tableAlias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { santaAssignments, santaAuditLog, santaExclusions, santaParticipants, users } from "@/db/schema";
import { requireSantaOrganizer } from "@/lib/santa/authz";
import { getSantaExchange } from "@/lib/santa/queries";
import { SANTA_UNSEAL_CONFIRMATION } from "@/lib/constants";
import {
  addExclusionAction, addParticipantAction, checkDrawAction, redrawAction, removeExclusionAction,
  removeParticipantAction, resetPinAction, runDrawAction, saveSettingsAction, unsealAction,
} from "@/actions/santa";
import SantaShell from "@/components/santa/SantaShell";
import Notice from "@/components/santa/Notice";
import WobblyCard from "@/components/ui/WobblyCard";
import InkButton from "@/components/ui/InkButton";
import HandInput from "@/components/ui/HandInput";

export { santaMetadata as generateMetadata } from "@/lib/santa/metadata";

export default async function OrganizePage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const ctx = await requireSantaOrganizer();
  const { error, notice } = await searchParams;
  const ex = getSantaExchange();

  const roster = await db
    .select({ id: users.id, name: users.name, pin: santaParticipants.reveal_pin_hash, joined_at: santaParticipants.joined_at })
    .from(santaParticipants)
    .innerJoin(users, eq(users.id, santaParticipants.user_id))
    .orderBy(asc(users.name));
  const rosterIds = roster.map((r) => r.id);
  const others = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(rosterIds.length ? notInArray(users.id, rosterIds) : undefined)
    .orderBy(asc(users.name));
  const nameOf = new Map(roster.map((p) => [p.id, p.name]));
  const exclusionRows = await db.select().from(santaExclusions);
  const totalAssignments = (await db.select({ c: count() }).from(santaAssignments))[0]?.c ?? 0;
  const revealed = (await db.select({ c: count() }).from(santaAssignments).where(isNotNull(santaAssignments.revealed_at)))[0]?.c ?? 0;
  const log = await db.select().from(santaAuditLog).orderBy(asc(santaAuditLog.created_at)).limit(200);
  const status = ex.draw_status;
  const editable = status !== "drawn";

  // Only the unsealed state ever joins receivers to names for the organizer.
  const giver = tableAlias(users, "giver");
  const receiver = tableAlias(users, "receiver");
  const pairs =
    status === "unsealed"
      ? await db
          .select({ giver: giver.name, receiver: receiver.name, revealed: santaAssignments.revealed_at })
          .from(santaAssignments)
          .innerJoin(giver, eq(giver.id, santaAssignments.giver_id))
          .innerJoin(receiver, eq(receiver.id, santaAssignments.receiver_id))
          .orderBy(asc(giver.name))
      : [];

  return (
    <SantaShell isOrganizer>
      <div className="animate-pop-in flex flex-col gap-6">
        <h1 className="text-4xl">organize</h1>
        <Notice error={error} notice={notice} />

        <WobblyCard tone="warm">
          <h2 className="text-2xl mb-2">the draw</h2>
          <p className="mb-3">
            status: <strong className="font-hand text-xl">{status === "none" ? "not drawn yet" : status === "drawn" ? "drawn & sealed" : "unsealed"}</strong>
            {status !== "none" && <> · {revealed} of {totalAssignments} revealed</>}
            {status === "none" && <> · {roster.length} in</>}
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={checkDrawAction}><InkButton type="submit" variant="ghost">check rules</InkButton></form>
            {status === "none" && <form action={runDrawAction}><InkButton type="submit">run the draw</InkButton></form>}
            {status !== "none" && (
              <form action={redrawAction}><InkButton type="submit" variant="soft" disabled={status === "drawn" && revealed > 0}>re-draw</InkButton></form>
            )}
          </div>
          {status === "drawn" && revealed > 0 && (
            <p className="mt-2 text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>re-draw is off because people have already looked. unsealing shows you every pair and is logged.</p>
          )}
          {status === "drawn" && (
            <form action={unsealAction} className="mt-4 flex flex-wrap items-end gap-3">
              <HandInput label={`type ${SANTA_UNSEAL_CONFIRMATION} to see all pairs`} name="confirm" autoComplete="off" className="w-44" />
              <InkButton type="submit" variant="ghost">unseal</InkButton>
            </form>
          )}
          {status === "unsealed" && (
            <table className="mt-4 w-full">
              <thead><tr className="text-left font-hand text-lg"><th>giver</th><th>→ receiver</th><th>revealed?</th></tr></thead>
              <tbody>{pairs.map((p) => <tr key={p.giver}><td>{p.giver}</td><td>{p.receiver}</td><td>{p.revealed ? "yes" : "no"}</td></tr>)}</tbody>
            </table>
          )}
        </WobblyCard>

        <WobblyCard>
          <h2 className="text-2xl mb-2">rules</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <HandInput label="budget" name="budget" defaultValue={ex.budget_text ?? ""} placeholder="$25-ish" maxLength={40} />
            <HandInput label="gifts by" name="deadline" type="date" defaultValue={ex.deadline_date ?? ""} />
            <label className="flex items-center gap-2 font-hand text-lg">
              <input type="checkbox" name="noMutual" defaultChecked={ex.no_mutual_pairs} disabled={status === "drawn"} />
              one big gift chain (nobody draws the person who drew them)
            </label>
            <HandInput as="textarea" label="house rules (shown to everyone)" name="houseRules" defaultValue={ex.house_rules ?? ""} placeholder="handmade encouraged. no gift cards." maxLength={2000} />
            <div><InkButton type="submit">save rules</InkButton></div>
          </form>
        </WobblyCard>

        <WobblyCard>
          <h2 className="text-2xl mb-2">who&apos;s in</h2>
          {!editable && <p className="mb-2 text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>locked while the draw is sealed.</p>}
          {roster.length === 0 && <p style={{ color: "var(--color-clay-ink-muted)" }}>nobody yet. people can join from the santa home page, or add them below.</p>}
          <ul className="flex flex-col gap-2">
            {roster.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3">
                <span className="font-hand text-xl">{p.name}</span>
                <span className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>{p.pin ? "pin set" : "no pin yet"}</span>
                {p.pin && (
                  <form action={resetPinAction}><input type="hidden" name="userId" value={p.id} /><button type="submit" className="font-hand cursor-pointer hover:underline">reset pin</button></form>
                )}
                {editable && (
                  <form action={removeParticipantAction}><input type="hidden" name="userId" value={p.id} /><button type="submit" className="font-hand cursor-pointer hover:underline" style={{ color: "var(--color-clay-blush)" }}>remove</button></form>
                )}
              </li>
            ))}
          </ul>
          {editable && others.length > 0 && (
            <form action={addParticipantAction} className="mt-4 flex items-end gap-3">
              <label className="flex flex-col gap-1 font-hand"><span className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>add a ClayDate friend</span>
                <select name="userId" className="hand-input" required>{others.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              </label>
              <InkButton type="submit" variant="soft">add</InkButton>
            </form>
          )}
        </WobblyCard>

        <WobblyCard>
          <h2 className="text-2xl mb-2">who can&apos;t draw whom</h2>
          {exclusionRows.length === 0 && <p style={{ color: "var(--color-clay-ink-muted)" }}>no exclusions. couples and last year&apos;s pairs go here.</p>}
          <ul className="flex flex-col gap-1">
            {exclusionRows.map((e) => (
              <li key={`${e.a_id}-${e.b_id}`} className="flex flex-wrap items-center gap-2">
                <span>{nameOf.get(e.a_id)} ↔ {nameOf.get(e.b_id)}</span>
                {e.note && <span className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>({e.note})</span>}
                {editable && (
                  <form action={removeExclusionAction}><input type="hidden" name="a" value={e.a_id} /><input type="hidden" name="b" value={e.b_id} /><button type="submit" className="font-hand cursor-pointer hover:underline" style={{ color: "var(--color-clay-blush)" }}>remove</button></form>
                )}
              </li>
            ))}
          </ul>
          {editable && roster.length >= 2 && (
            <form action={addExclusionAction} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 font-hand"><span className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>this person</span>
                <select name="a" className="hand-input" required>{roster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1 font-hand"><span className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>and this person</span>
                <select name="b" className="hand-input" required>{roster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              </label>
              <HandInput label="why (optional)" name="note" placeholder="married" maxLength={80} className="w-40" />
              <InkButton type="submit" variant="soft">exclude</InkButton>
            </form>
          )}
        </WobblyCard>

        <WobblyCard>
          <h2 className="text-2xl mb-2">log</h2>
          {log.length === 0 ? <p style={{ color: "var(--color-clay-ink-muted)" }}>nothing yet.</p> : (
            <ul className="text-sm flex flex-col gap-1">
              {[...log].reverse().slice(0, 30).map((l) => (
                <li key={l.id}>
                  <span style={{ color: "var(--color-clay-ink-muted)" }}>{new Date(l.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  {" · "}{l.actor_id ? (nameOf.get(l.actor_id) ?? ctx.user.name) : "system"} · <strong>{l.action}</strong>
                  {l.detail && <span style={{ color: "var(--color-clay-ink-muted)" }}> {l.detail}</span>}
                </li>
              ))}
            </ul>
          )}
        </WobblyCard>
      </div>
    </SantaShell>
  );
}
