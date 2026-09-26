import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { santaAssignments, santaParticipants, santaWishItems, users } from "@/db/schema";
import { getSession, canEdit } from "@/lib/session";
import { requireSantaUser } from "@/lib/santa/authz";
import { getSantaExchange, sessionKeyFor } from "@/lib/santa/queries";
import { formatDeadline } from "@/lib/santa/rules";
import { SANTA_ORGANIZERS } from "@/lib/constants";
import { hideRevealAction, joinSantaAction, leaveSantaAction, setRevealPinAction, unlockRevealAction } from "@/actions/santa";
import SantaShell from "@/components/santa/SantaShell";
import Notice from "@/components/santa/Notice";
import WobblyCard from "@/components/ui/WobblyCard";
import InkButton from "@/components/ui/InkButton";
import HandInput from "@/components/ui/HandInput";

export { santaMetadata as generateMetadata } from "@/lib/santa/metadata";

export default async function SantaHome({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const ctx = await requireSantaUser();
  const { error, notice } = await searchParams;
  const ex = getSantaExchange();
  const session = await getSession();
  const drawn = ex.draw_status !== "none";

  const participantCount = (await db.select({ c: count() }).from(santaParticipants))[0]?.c ?? 0;
  const myItems = (await db.select({ c: count() }).from(santaWishItems).where(eq(santaWishItems.user_id, ctx.user.id)))[0]?.c ?? 0;

  const myAssignment = ctx.participant
    ? (
        await db
          .select({ receiver_id: santaAssignments.receiver_id, receiver_name: users.name })
          .from(santaAssignments)
          .innerJoin(users, eq(users.id, santaAssignments.receiver_id))
          .where(eq(santaAssignments.giver_id, ctx.user.id))
          .limit(1)
      )[0]
    : undefined;
  const pinHash = ctx.participant?.reveal_pin_hash ?? null;
  const unlocked = !!pinHash && session.santaKey === sessionKeyFor(pinHash);

  return (
    <SantaShell isOrganizer={ctx.isOrganizer} hero year={ex.year}>
      <Notice error={error} notice={notice} />
      <div className="flex flex-col gap-5 animate-pop-in">
        <WobblyCard tone="warm">
          <h2 className="text-2xl mb-2">your person</h2>
          {!ctx.participant && !drawn && (
            <form action={joinSantaAction} className="flex items-center gap-3 flex-wrap">
              <span>{participantCount} {participantCount === 1 ? "person is" : "people are"} in so far. you?</span>
              {canEdit(ctx.role) ? <InkButton type="submit">count me in</InkButton> : <span className="text-sm">(guests can watch)</span>}
            </form>
          )}
          {!ctx.participant && drawn && <p>the draw already happened without you — ask the organizer.</p>}
          {ctx.participant && !drawn && (
            <div className="flex items-center gap-3 flex-wrap">
              <span>you&apos;re in, with {participantCount - 1} others. the draw hasn&apos;t happened yet.</span>
              <form action={leaveSantaAction}><button type="submit" className="font-hand hover:underline cursor-pointer text-sm">count me out</button></form>
            </div>
          )}
          {ctx.participant && drawn && !myAssignment && <p>hmm, you weren&apos;t in the draw — ask the organizer.</p>}
          {ctx.participant && drawn && myAssignment && !pinHash && (
            <form action={setRevealPinAction} className="flex flex-col gap-3 max-w-xs">
              <p>it&apos;s decided! pick a 4 to 6 digit pin first — everyone shares the ClayDate password, so this keeps your person yours.</p>
              <HandInput label="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4,6}" autoComplete="new-password" required />
              <HandInput label="again" name="confirm" type="password" inputMode="numeric" pattern="[0-9]{4,6}" autoComplete="new-password" required />
              <div><InkButton type="submit">reveal 🎁</InkButton></div>
            </form>
          )}
          {ctx.participant && drawn && myAssignment && pinHash && !unlocked && (
            <form action={unlockRevealAction} className="flex items-end gap-3 flex-wrap">
              <HandInput label="your pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4,6}" autoComplete="current-password" required className="w-32" />
              <InkButton type="submit">reveal 🎁</InkButton>
            </form>
          )}
          {ctx.participant && drawn && myAssignment && unlocked && (
            <div className="flex flex-col gap-2">
              <p className="text-3xl font-hand">
                you&apos;ve got <span style={{ color: "var(--accent)" }}>{myAssignment.receiver_name}</span>
              </p>
              <div className="flex gap-4 items-center">
                <Link href={`/santa/wishlists/${myAssignment.receiver_id}`} className="font-hand text-lg hover:underline">see their wish list →</Link>
                <form action={hideRevealAction}><button type="submit" className="font-hand text-sm hover:underline cursor-pointer">hide</button></form>
              </div>
            </div>
          )}
        </WobblyCard>

        <WobblyCard>
          <h2 className="text-2xl mb-2">the rules</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-hand text-lg">budget</dt>
            <dd>{ex.budget_text || "not set yet"}</dd>
            <dt className="font-hand text-lg">gifts by</dt>
            <dd>{ex.deadline_date ? formatDeadline(ex.deadline_date) : "not set yet"}</dd>
            {ex.no_mutual_pairs && (
              <>
                <dt className="font-hand text-lg">chain</dt>
                <dd>one big gift chain — nobody draws the person who drew them</dd>
              </>
            )}
          </dl>
          {ex.house_rules && <p className="mt-3 whitespace-pre-line">{ex.house_rules}</p>}
          {SANTA_ORGANIZERS.length === 0 && (
            <p className="mt-3 text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>no organizer configured yet (SANTA_ORGANIZERS).</p>
          )}
        </WobblyCard>

        <WobblyCard>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl">your wish list</h2>
            <Link href="/santa/me" className="font-hand text-lg hover:underline">edit →</Link>
          </div>
          <p style={{ color: "var(--color-clay-ink-muted)" }}>
            {myItems === 0 ? "empty! your person will thank you for a few ideas." : `${myItems} idea${myItems === 1 ? "" : "s"} so far.`}
          </p>
          <Link href="/santa/wishlists" className="inline-block mt-3 font-hand text-lg hover:underline">browse everyone&apos;s lists →</Link>
        </WobblyCard>
      </div>
    </SantaShell>
  );
}
