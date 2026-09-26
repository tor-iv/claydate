import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { getRequestAlias } from "@/lib/santa/alias-request";

interface SantaShellProps {
  children: ReactNode;
  isOrganizer?: boolean;
  /** Show the big hero (home page) or just the compact bar. */
  hero?: boolean;
  year?: number;
}

/**
 * Wraps every /santa page. Renders the rotating alias (same request cache as
 * generateMetadata, so the tab title and the banner always agree) and sets
 * --accent for the section. Lives in the page, not a layout, so it re-rolls
 * on every navigation.
 */
export default async function SantaShell({ children, isOrganizer = false, hero = false, year }: SantaShellProps) {
  const alias = await getRequestAlias();
  return (
    <div className="relative flex-1 w-full max-w-3xl mx-auto px-4 py-5 sm:px-6" style={{ "--accent": alias.accent } as CSSProperties}>
      {hero ? (
        <section className="text-center pb-4">
          <div style={{ fontSize: "3.5rem", lineHeight: 1 }} aria-hidden="true">{alias.emoji}</div>
          <h1 className="text-5xl mt-2" style={{ color: "var(--accent)" }}>{alias.name}</h1>
          <p className="text-xl" style={{ color: "var(--color-clay-ink-muted)" }}>
            {alias.tagline}{year ? ` · ${year}` : ""}
          </p>
        </section>
      ) : (
        <div className="flex items-center gap-2 pb-3">
          <span aria-hidden="true" style={{ fontSize: "1.5rem", lineHeight: 1 }}>{alias.emoji}</span>
          <Link href="/santa" className="font-hand text-2xl no-underline" style={{ color: "var(--accent)" }}>{alias.name}</Link>
          <span className="hidden sm:inline text-sm" style={{ color: "var(--color-clay-ink-muted)" }}>{alias.tagline}</span>
        </div>
      )}
      <nav className="flex flex-wrap gap-x-4 gap-y-1 font-hand text-lg pb-4" style={{ borderBottom: "2px dashed rgba(44,24,16,0.2)", marginBottom: "1.25rem" }}>
        <Link href="/santa" className="hover:underline">home</Link>
        <Link href="/santa/wishlists" className="hover:underline">wish lists</Link>
        <Link href="/santa/me" className="hover:underline">my list</Link>
        {isOrganizer && <Link href="/santa/organize" className="hover:underline">organize</Link>}
      </nav>
      {children}
    </div>
  );
}
