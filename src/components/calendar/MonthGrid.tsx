import { monthGrid } from "@/lib/dates";
import DayCell from "./DayCell";

interface MonthGridMeetup {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
}

interface MonthGridProps {
  monthParam: string; // "YYYY-MM"
  meetups: MonthGridMeetup[];
  todayIso: string;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthGrid({
  monthParam,
  meetups,
  todayIso,
}: MonthGridProps) {
  const [yearStr, monthStr] = monthParam.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const weeks = monthGrid(year, month);

  // Build a lookup: ISO date → meetups[]
  const meetupsByDate: Record<string, MonthGridMeetup[]> = {};
  for (const m of meetups) {
    if (!meetupsByDate[m.date]) meetupsByDate[m.date] = [];
    meetupsByDate[m.date].push(m);
  }

  return (
    <div
      style={{
        border: "1.5px solid rgba(44,24,16,0.18)",
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(245,240,232,0.7)",
      }}
    >
      {/* Day-of-week header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1.5px solid rgba(44,24,16,0.15)",
        }}
      >
        {DOW_LABELS.map((label, i) => (
          <div
            key={label}
            style={{
              padding: "6px 0",
              textAlign: "center",
              fontFamily: "var(--font-hand)",
              fontSize: "0.7rem",
              color:
                i === 0 || i === 6
                  ? "var(--color-clay-rust)"
                  : "var(--color-clay-ink-muted)",
              letterSpacing: "0.03em",
              borderRight:
                i < 6 ? "1px solid rgba(44,24,16,0.08)" : undefined,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div
          key={wi}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderBottom:
              wi < weeks.length - 1
                ? "1px solid rgba(44,24,16,0.1)"
                : undefined,
          }}
        >
          {week.map((iso, di) => (
            <div
              key={di}
              style={{
                borderRight:
                  di < 6 ? "1px solid rgba(44,24,16,0.08)" : undefined,
              }}
            >
              <DayCell
                iso={iso}
                meetups={iso ? (meetupsByDate[iso] ?? []) : []}
                isToday={iso === todayIso}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
