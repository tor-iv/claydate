import { redirect } from "next/navigation";
import { gte, lte, and } from "drizzle-orm";
import { db } from "@/db";
import { meetups } from "@/db/schema";
import {
  isValidWeekParam,
  currentWeekParam,
  weekDays,
  prevWeekParam,
  nextWeekParam,
  weekRangeLabel,
  nowInNY,
  todayISO,
} from "@/lib/dates";
import ViewToggle from "@/components/shared/ViewToggle";
import WeekGrid from "@/components/calendar/week/WeekGrid";
import Link from "next/link";

interface WeekPageProps {
  params: Promise<{ weekParam: string }>;
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { weekParam } = await params;

  // Validate — redirect to current week if invalid
  if (!isValidWeekParam(weekParam)) {
    redirect(`/calendar/week/${currentWeekParam()}`);
  }

  const days = weekDays(weekParam);
  const firstDay = days[0];
  const lastDay = days[6];

  // Query meetups falling within this week
  const rows = await db
    .select({
      id: meetups.id,
      title: meetups.title,
      date: meetups.date,
      time: meetups.time,
    })
    .from(meetups)
    .where(and(gte(meetups.date, firstDay), lte(meetups.date, lastDay)));

  const prev = prevWeekParam(weekParam);
  const next = nextWeekParam(weekParam);
  const currentWeek = currentWeekParam();
  const isCurrentWeek = weekParam === currentWeek;
  const todayIso = todayISO();
  const now = nowInNY();
  const label = weekRangeLabel(weekParam);

  return (
    <main className="flex flex-col flex-1 px-0 py-4 sm:px-4 sm:py-6 max-w-6xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-4 sm:px-0">
        {/* Week nav */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/calendar/week/${prev}`}
            aria-label="Previous week"
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
              flexShrink: 0,
            }}
          >
            ‹
          </Link>

          <h2
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(1.1rem, 3.5vw, 1.6rem)",
              fontWeight: 700,
              color: "var(--color-clay-ink)",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {label}
          </h2>

          <Link
            href={`/calendar/week/${next}`}
            aria-label="Next week"
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
              flexShrink: 0,
            }}
          >
            ›
          </Link>

          {!isCurrentWeek && (
            <Link
              href={`/calendar/week/${currentWeek}`}
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

        <ViewToggle active="week" />
      </div>

      <h1 className="sr-only">Week of {label} — ClayDate calendar</h1>

      <WeekGrid
        days={days}
        meetups={rows}
        todayIso={todayIso}
        nowMinutes={now.minutesSinceMidnight}
        nowDateISO={now.dateISO}
      />
    </main>
  );
}
