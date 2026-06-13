import Link from "next/link";
import MeetupDot from "./MeetupDot";

interface DayCellMeetup {
  id: string;
  title: string;
}

interface DayCellProps {
  iso: string | null;
  meetups: DayCellMeetup[];
  isToday: boolean;
}

export default function DayCell({ iso, meetups, isToday }: DayCellProps) {
  // Empty leading/trailing cell
  if (!iso) {
    return (
      <div
        aria-hidden="true"
        style={{ minHeight: 56 }}
      />
    );
  }

  const dayNum = parseInt(iso.split("-")[2], 10);
  const hasMeetups = meetups.length > 0;
  const firstMeetup = meetups[0];

  const inner = (
    <div
      className="flex flex-col gap-0.5 h-full"
      style={{
        padding: "4px 5px",
        minHeight: 56,
        position: "relative",
      }}
    >
      {/* Day number — with today highlight */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          fontFamily: "var(--font-body)",
          fontSize: "0.8rem",
          lineHeight: 1,
          color: isToday ? "var(--color-clay-cream)" : "var(--color-clay-ink)",
          borderRadius: "50%",
          flexShrink: 0,
          // Rust circle for today
          background: isToday ? "var(--color-clay-rust)" : "transparent",
          border: isToday ? "1.5px solid var(--color-clay-ink)" : "none",
          fontWeight: isToday ? 700 : 400,
        }}
      >
        {dayNum}
      </span>

      {/* Meetup dots / chips */}
      {hasMeetups && (
        <MeetupDot title={firstMeetup.title} count={meetups.length} />
      )}
    </div>
  );

  if (hasMeetups && firstMeetup) {
    return (
      <Link
        href={`/meetups/${firstMeetup.id}`}
        className="day-cell-link block rounded"
        style={{
          textDecoration: "none",
          color: "inherit",
        }}
        title={`${meetups.length === 1 ? firstMeetup.title : `${meetups.length} meetups`} on ${iso}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      style={{
        minHeight: 56,
        borderRadius: 4,
      }}
    >
      {inner}
    </div>
  );
}
