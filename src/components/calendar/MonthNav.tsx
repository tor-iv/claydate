import Link from "next/link";
import {
  formatMonthName,
  prevMonthParam,
  nextMonthParam,
  currentMonthParam,
} from "@/lib/dates";

interface MonthNavProps {
  monthParam: string; // "YYYY-MM"
}

export default function MonthNav({ monthParam }: MonthNavProps) {
  const prev = prevMonthParam(monthParam);
  const next = nextMonthParam(monthParam);
  const todayParam = currentMonthParam();
  const isCurrentMonth = monthParam === todayParam;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Prev arrow */}
      <Link
        href={`/calendar/${prev}`}
        aria-label={`Go to ${formatMonthName(prev)}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1.5px solid rgba(44,24,16,0.3)",
          background: "transparent",
          color: "var(--color-clay-ink)",
          fontFamily: "var(--font-hand)",
          fontSize: "1rem",
          textDecoration: "none",
          transition: "background 0.1s",
          flexShrink: 0,
        }}
      >
        ‹
      </Link>

      {/* Month name */}
      <h2
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: "clamp(1.3rem, 4vw, 1.7rem)",
          fontWeight: 700,
          color: "var(--color-clay-ink)",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {formatMonthName(monthParam)}
      </h2>

      {/* Next arrow */}
      <Link
        href={`/calendar/${next}`}
        aria-label={`Go to ${formatMonthName(next)}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1.5px solid rgba(44,24,16,0.3)",
          background: "transparent",
          color: "var(--color-clay-ink)",
          fontFamily: "var(--font-hand)",
          fontSize: "1rem",
          textDecoration: "none",
          transition: "background 0.1s",
          flexShrink: 0,
        }}
      >
        ›
      </Link>

      {/* Today link — only shown when not on current month */}
      {!isCurrentMonth && (
        <Link
          href={`/calendar/${todayParam}`}
          style={{
            marginLeft: 4,
            fontSize: "0.8rem",
            fontFamily: "var(--font-hand)",
            color: "var(--color-clay-rust)",
            textDecoration: "none",
            border: "1.5px solid rgba(184,92,42,0.4)",
            borderRadius: 6,
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}
        >
          today
        </Link>
      )}
    </div>
  );
}
