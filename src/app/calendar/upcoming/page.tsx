import Link from "next/link";
import { gte, asc } from "drizzle-orm";
import { count as sqlCount } from "drizzle-orm/sql/functions";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meetups, rsvps } from "@/db/schema";
import { todayISO } from "@/lib/dates";
import ViewToggle from "@/components/shared/ViewToggle";
import MeetupCard from "@/components/meetups/MeetupCard";
import DoodleIcon from "@/components/ui/DoodleIcon";

export default async function UpcomingPage() {
  const today = todayISO();

  // 1) All upcoming meetups, ordered by date then time
  const upcomingMeetups = await db
    .select({
      id: meetups.id,
      title: meetups.title,
      location: meetups.location,
      date: meetups.date,
      time: meetups.time,
    })
    .from(meetups)
    .where(gte(meetups.date, today))
    .orderBy(asc(meetups.date), asc(meetups.time));

  if (upcomingMeetups.length === 0) {
    return (
      <main className="flex flex-col flex-1 px-4 py-4 sm:px-6 sm:py-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h1
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(1.3rem, 4vw, 1.7rem)",
              fontWeight: 700,
              color: "var(--color-clay-ink)",
              margin: 0,
            }}
          >
            upcoming
          </h1>
          <ViewToggle active="list" />
        </div>

        <div className="flex flex-col items-center gap-4 mt-10 text-center">
          <DoodleIcon name="leaf" size={44} color="var(--color-clay-rust)" />
          <p
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.2rem",
              color: "var(--color-clay-ink-muted)",
            }}
          >
            no pottery dates lined up... yet
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
      </main>
    );
  }

  // 2) Aggregate RSVP counts for those meetups
  const meetupIds = upcomingMeetups.map((m) => m.id);

  // Two simple queries — merge in JS (this is a friends app)
  const yesCounts = await db
    .select({
      meetupId: rsvps.meetup_id,
      n: sqlCount(rsvps.id),
    })
    .from(rsvps)
    .where(eq(rsvps.status, "yes"))
    .groupBy(rsvps.meetup_id);

  const maybeCounts = await db
    .select({
      meetupId: rsvps.meetup_id,
      n: sqlCount(rsvps.id),
    })
    .from(rsvps)
    .where(eq(rsvps.status, "maybe"))
    .groupBy(rsvps.meetup_id);

  const yesMap: Record<string, number> = {};
  for (const row of yesCounts) {
    if (meetupIds.includes(row.meetupId)) yesMap[row.meetupId] = row.n;
  }
  const maybeMap: Record<string, number> = {};
  for (const row of maybeCounts) {
    if (meetupIds.includes(row.meetupId)) maybeMap[row.meetupId] = row.n;
  }

  return (
    <main className="flex flex-col flex-1 px-4 py-4 sm:px-6 sm:py-6 max-w-2xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "clamp(1.3rem, 4vw, 1.7rem)",
            fontWeight: 700,
            color: "var(--color-clay-ink)",
            margin: 0,
          }}
        >
          upcoming
        </h1>
        <ViewToggle active="list" />
      </div>

      {/* Meetup list */}
      <div className="flex flex-col gap-3">
        {upcomingMeetups.map((m) => (
          <MeetupCard
            key={m.id}
            id={m.id}
            title={m.title}
            location={m.location}
            date={m.date}
            time={m.time}
            yesCount={yesMap[m.id] ?? 0}
            maybeCount={maybeMap[m.id] ?? 0}
          />
        ))}
      </div>
    </main>
  );
}
