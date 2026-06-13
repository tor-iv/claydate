import { redirect } from "next/navigation";
import Link from "next/link";
import { gte, lte, and } from "drizzle-orm";
import { db } from "@/db";
import { meetups } from "@/db/schema";
import {
  isValidMonthParam,
  currentMonthParam,
  todayISO,
  formatMonthName,
} from "@/lib/dates";
import MonthGrid from "@/components/calendar/MonthGrid";
import MonthNav from "@/components/calendar/MonthNav";
import ViewToggle from "@/components/shared/ViewToggle";
import DoodleIcon from "@/components/ui/DoodleIcon";

interface MonthPageProps {
  params: Promise<{ monthParam: string }>;
}

export default async function MonthPage({ params }: MonthPageProps) {
  const { monthParam } = await params;

  // Validate param — redirect to current month if invalid
  if (!isValidMonthParam(monthParam)) {
    redirect(`/calendar/${currentMonthParam()}`);
  }

  const [yearStr, monthStr] = monthParam.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Date range for this month
  const firstDay = `${monthParam}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const lastDay = `${monthParam}-${String(lastDayNum).padStart(2, "0")}`;

  // Query meetups in this month
  const rows = await db
    .select({ id: meetups.id, title: meetups.title, date: meetups.date })
    .from(meetups)
    .where(and(gte(meetups.date, firstDay), lte(meetups.date, lastDay)));

  const todayIso = todayISO();
  const isEmpty = rows.length === 0;

  return (
    <main className="flex flex-col flex-1 px-4 py-4 sm:px-6 sm:py-6 max-w-3xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <MonthNav monthParam={monthParam} />
        <ViewToggle active="month" />
      </div>

      {/* Month title (for screen readers / SEO) */}
      <h1 className="sr-only">{formatMonthName(monthParam)} — ClayDate calendar</h1>

      {/* Calendar grid */}
      <MonthGrid monthParam={monthParam} meetups={rows} todayIso={todayIso} />

      {/* Empty state */}
      {isEmpty && (
        <div
          className="flex flex-col items-center gap-4 mt-10 text-center"
          aria-label="No meetups this month"
        >
          <DoodleIcon name="squiggle" size={40} color="var(--color-clay-rust)" />
          <p
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.2rem",
              color: "var(--color-clay-ink-muted)",
            }}
          >
            no pottery dates this month... yet
          </p>
          <Link
            href="/meetups/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              fontFamily: "var(--font-hand)",
              fontSize: "1rem",
              color: "var(--color-clay-cream)",
              background: "var(--color-clay-rust)",
              border: "2px solid var(--color-clay-ink)",
              borderRadius: 10,
              boxShadow: "2px 3px 0px #2C1810",
              textDecoration: "none",
            }}
          >
            <DoodleIcon name="pot" size={18} color="var(--color-clay-cream)" />
            plan a meetup
          </Link>
        </div>
      )}
    </main>
  );
}
