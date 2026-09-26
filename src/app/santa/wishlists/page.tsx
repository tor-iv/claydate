import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { santaParticipants, santaWishItems, users } from "@/db/schema";
import { requireSantaUser } from "@/lib/santa/authz";
import SantaShell from "@/components/santa/SantaShell";
import WobblyCard from "@/components/ui/WobblyCard";

export { santaMetadata as generateMetadata } from "@/lib/santa/metadata";

export default async function WishlistsPage() {
  const ctx = await requireSantaUser();
  const rows = await db
    .select({ id: users.id, name: users.name, items: count(santaWishItems.id) })
    .from(santaParticipants)
    .innerJoin(users, eq(users.id, santaParticipants.user_id))
    .leftJoin(santaWishItems, eq(santaWishItems.user_id, users.id))
    .groupBy(users.id)
    .orderBy(asc(users.name));

  return (
    <SantaShell isOrganizer={ctx.isOrganizer}>
      <h1 className="text-4xl mb-4">everyone&apos;s wish lists</h1>
      {rows.length === 0 && <p style={{ color: "var(--color-clay-ink-muted)" }}>nobody has joined yet.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((p) => (
          <Link key={p.id} href={p.id === ctx.user.id ? "/santa/me" : `/santa/wishlists/${p.id}`} className="no-underline">
            <WobblyCard tone={p.id === ctx.user.id ? "warm" : "cream"} className="hover:-translate-y-0.5 transition-transform">
              <div className="font-hand text-2xl">{p.name}{p.id === ctx.user.id ? " (you)" : ""}</div>
              <div className="text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>
                {p.items === 0 ? "nothing yet" : `${p.items} idea${p.items === 1 ? "" : "s"}`}
              </div>
            </WobblyCard>
          </Link>
        ))}
      </div>
    </SantaShell>
  );
}
