/**
 * MeetupDot — shown inside a DayCell when there are meetups on that day.
 * Mobile: rust dot with optional count badge.
 * sm+: a truncated title chip (hidden on mobile, visible on sm+).
 */

interface MeetupDotProps {
  title: string;
  count: number; // total meetups on this day
}

export default function MeetupDot({ title, count }: MeetupDotProps) {
  return (
    <span className="flex items-center gap-0.5 min-w-0">
      {/* Mobile dot — always visible */}
      <span
        className="relative flex-shrink-0 sm:hidden"
        aria-hidden="true"
      >
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--color-clay-rust)",
            border: "1px solid var(--color-clay-ink)",
          }}
        />
        {count > 1 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -6,
              fontSize: "0.5rem",
              lineHeight: 1,
              background: "var(--color-clay-rust)",
              color: "var(--color-clay-cream)",
              border: "1px solid var(--color-clay-ink)",
              borderRadius: 99,
              padding: "0 2px",
              fontFamily: "var(--font-hand)",
              fontWeight: 700,
            }}
          >
            {count}
          </span>
        )}
      </span>

      {/* sm+ title chip */}
      <span
        className="hidden sm:flex items-center gap-1 min-w-0"
        style={{
          background: "var(--color-clay-rust)",
          color: "var(--color-clay-cream)",
          border: "1px solid var(--color-clay-ink)",
          borderRadius: 4,
          padding: "1px 4px",
          fontSize: "0.65rem",
          fontFamily: "var(--font-hand)",
          lineHeight: 1.3,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {count > 1 && (
          <span
            style={{
              background: "var(--color-clay-ink)",
              color: "var(--color-clay-cream)",
              borderRadius: 99,
              padding: "0 3px",
              fontSize: "0.55rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {count}
          </span>
        )}
        <span
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
      </span>
    </span>
  );
}
