import Link from "next/link";
import DoodleIcon from "@/components/ui/DoodleIcon";
import UserTag from "./UserTag";
import NavLinks from "./NavLinks";
import { logoutAction } from "@/actions/auth";
import type { AvatarShape, AvatarGlaze, AvatarPattern } from "@/lib/avatars";

export interface PageHeaderUser {
  name: string;
  avatarShape: AvatarShape | string;
  avatarGlaze: AvatarGlaze | string;
  avatarPattern: AvatarPattern | string;
}

interface PageHeaderProps {
  user?: PageHeaderUser | null;
}

export default function PageHeader({ user = null }: PageHeaderProps) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6 sm:py-4"
      style={{
        borderBottom: "2px solid rgba(44,24,16,0.2)",
        background: "rgba(245,240,232,0.85)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logotype */}
      <Link href="/calendar" className="flex items-center gap-2 no-underline">
        <DoodleIcon name="pot" size={28} color="#B85C2A" />
        <span
          className="leading-none"
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "1.9rem",
            fontWeight: 700,
            color: "#2C1810",
            letterSpacing: "-0.01em",
          }}
        >
          ClayDate
        </span>
        <span
          className="hidden sm:inline-block"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            color: "#7A8C6E",
            marginLeft: 4,
            marginTop: 2,
          }}
        >
          pottery dates at slo slo 🏺
        </span>
      </Link>

      {/* Nav — active state computed client-side via usePathname */}
      <NavLinks />

      {/* User / right side */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <UserTag user={user} />
            <form action={logoutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "0.9rem",
                  color: "var(--color-clay-ink-muted)",
                  background: "transparent",
                  border: "1.5px solid rgba(44,24,16,0.25)",
                  cursor: "pointer",
                }}
              >
                bye!
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full text-sm"
            style={{
              fontFamily: "var(--font-hand)",
              background: "#B85C2A",
              color: "#F5F0E8",
              border: "1.5px solid #2C1810",
              fontSize: "0.95rem",
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
