import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { santaWishItems, users } from "@/db/schema";
import { requireSantaUser } from "@/lib/santa/authz";
import SantaShell from "@/components/santa/SantaShell";
import WobblyCard from "@/components/ui/WobblyCard";

export { santaMetadata as generateMetadata } from "@/lib/santa/metadata";

export default async function WishlistPage({ params }: { params: Promise<{ userId: string }> }) {
  const ctx = await requireSantaUser();
  const { userId } = await params;
  if (userId === ctx.user.id) redirect("/santa/me");
  const person = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!person) notFound();
  const items = await db.select().from(santaWishItems).where(eq(santaWishItems.user_id, person.id)).orderBy(asc(santaWishItems.position));

  return (
    <SantaShell isOrganizer={ctx.isOrganizer}>
      <Link href="/santa/wishlists" className="font-hand text-lg hover:underline">← all lists</Link>
      <h1 className="text-4xl mt-2 mb-4">{person.name}&apos;s wish list</h1>
      <WobblyCard>
        {items.length === 0 ? (
          <p style={{ color: "var(--color-clay-ink-muted)" }}>{person.name} hasn&apos;t written anything yet. surprise them!</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((i, n) => (
              <li key={i.id} className="flex gap-3">
                <span className="font-hand text-xl" style={{ color: "var(--accent)" }}>{n + 1}.</span>
                <div>
                  <div className="text-lg">{i.url ? <a href={i.url} target="_blank" rel="noreferrer" className="underline">{i.title}</a> : i.title}</div>
                  {i.price_note && <div className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>{i.price_note}</div>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </WobblyCard>
    </SantaShell>
  );
}
