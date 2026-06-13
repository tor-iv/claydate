import Link from "next/link";
import DoodleIcon from "@/components/ui/DoodleIcon";
import UserTag from "./UserTag";
import type { AvatarShape, AvatarGlaze, AvatarPattern } from "@/lib/avatars";

interface PageHeaderUser {
  name: string;
  avatarShape: AvatarShape | string;
  avatarGlaze: AvatarGlaze | string;
  avatarPattern: AvatarPattern | string;
}

interface PageHeaderProps {
  user?: PageHeaderUser | null;
  activePath?: string;
}

const NAV_LINKS = [
  { href: "/calendar",          label: "Calendar" },
  { href: "/calendar/upcoming", label: "Upcoming" },
  { href: "/meetups/new",       label: "New Meetup" },
];

export default function PageHeader({ user = null, activePath }: PageHeaderProps) {
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

      {/* Nav */}
      {/* Full-width centered row below the logo on small screens; inline on md+ */}
      <nav className="order-3 w-full md:order-none md:w-auto flex items-center justify-center gap-1">
        {NAV_LINKS.map((link) => {
          const isActive = activePath === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                fontFamily: "var(--font-hand)",
                color: isActive ? "#F5F0E8" : "#2C1810",
                background: isActive ? "#B85C2A" : "transparent",
                border: isActive ? "1.5px solid #2C1810" : "1.5px solid transparent",
                fontSize: "1rem",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User / right side */}
      <div className="flex items-center">
        {user ? (
          <UserTag user={user} />
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
