"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  showNewMeetup?: boolean;
}

const BASE_NAV_LINKS = [
  { href: "/calendar",          label: "Calendar" },
  { href: "/calendar/upcoming", label: "Upcoming" },
];

const NEW_MEETUP_LINK = { href: "/meetups/new", label: "New Meetup" };

export default function NavLinks({ showNewMeetup = true }: NavLinksProps) {
  const pathname = usePathname();

  const links = showNewMeetup ? [...BASE_NAV_LINKS, NEW_MEETUP_LINK] : BASE_NAV_LINKS;

  return (
    <nav className="order-3 w-full md:order-none md:w-auto flex items-center justify-center gap-1">
      {links.map((link) => {
        // Exact-match: /calendar matches /calendar, /calendar/upcoming matches /calendar/upcoming
        const isActive = pathname === link.href;
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
  );
}
