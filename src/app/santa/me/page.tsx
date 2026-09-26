import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { santaWishItems } from "@/db/schema";
import { canEdit } from "@/lib/session";
import { requireSantaUser } from "@/lib/santa/authz";
import { addWishItemAction, moveWishItemAction, removeWishItemAction } from "@/actions/santa";
import SantaShell from "@/components/santa/SantaShell";
import Notice from "@/components/santa/Notice";
import WobblyCard from "@/components/ui/WobblyCard";
import InkButton from "@/components/ui/InkButton";
import HandInput from "@/components/ui/HandInput";

export { santaMetadata as generateMetadata } from "@/lib/santa/metadata";

export default async function MyWishlistPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const ctx = await requireSantaUser();
  const { error, notice } = await searchParams;
  const items = await db.select().from(santaWishItems).where(eq(santaWishItems.user_id, ctx.user.id)).orderBy(asc(santaWishItems.position));

  return (
    <SantaShell isOrganizer={ctx.isOrganizer}>
      <div className="animate-pop-in flex flex-col gap-5">
        <h1 className="text-4xl">your wish list</h1>
        <Notice error={error} notice={notice} />
        <WobblyCard>
          {items.length === 0 ? (
            <p style={{ color: "var(--color-clay-ink-muted)" }}>nothing yet. add a few ideas below — links help!</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {items.map((i, n) => (
                <li key={i.id} className="flex items-start gap-3">
                  <span className="font-hand text-xl" style={{ color: "var(--accent)" }}>{n + 1}.</span>
                  <div className="flex-1">
                    <div className="text-lg">{i.url ? <a href={i.url} target="_blank" rel="noreferrer" className="underline">{i.title}</a> : i.title}</div>
                    {i.price_note && <div className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>{i.price_note}</div>}
                  </div>
                  <div className="flex gap-1">
                    <form action={moveWishItemAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="dir" value="up" /><button type="submit" className="px-2 cursor-pointer" aria-label="move up" disabled={n === 0}>↑</button></form>
                    <form action={moveWishItemAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="dir" value="down" /><button type="submit" className="px-2 cursor-pointer" aria-label="move down" disabled={n === items.length - 1}>↓</button></form>
                    <form action={removeWishItemAction}><input type="hidden" name="id" value={i.id} /><button type="submit" className="px-2 cursor-pointer" aria-label="remove" style={{ color: "var(--color-clay-blush)" }}>✕</button></form>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </WobblyCard>
        {canEdit(ctx.role) && (
          <WobblyCard tone="warm">
            <h2 className="text-2xl mb-2">add an idea</h2>
            <form action={addWishItemAction} className="flex flex-col gap-3">
              <HandInput label="what" name="title" placeholder="wool socks, the good kind" maxLength={120} required />
              <HandInput label="link (optional)" name="url" placeholder="https://…" inputMode="url" />
              <HandInput label="price-ish (optional)" name="price" placeholder="about $20" maxLength={40} />
              <div><InkButton type="submit">add it</InkButton></div>
            </form>
          </WobblyCard>
        )}
      </div>
    </SantaShell>
  );
}
