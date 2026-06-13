import Link from "next/link";
import WobblyCard from "@/components/ui/WobblyCard";
import DoodleIcon from "@/components/ui/DoodleIcon";
import { formatFriendlyDate, formatTime12h } from "@/lib/dates";

interface MeetupCardProps {
  id: string;
  title: string;
  location: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  yesCount: number;
  maybeCount: number;
}

export default function MeetupCard({
  id,
  title,
  location,
  date,
  time,
  yesCount,
  maybeCount,
}: MeetupCardProps) {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const dateObj = new Date(
    parseInt(yearStr, 10),
    parseInt(monthStr, 10) - 1,
    parseInt(dayStr, 10)
  );
  const shortMonth = dateObj.toLocaleString("en-US", { month: "short" });
  const dayNum = parseInt(dayStr, 10);

  const rsvpParts: string[] = [];
  if (yesCount > 0) rsvpParts.push(`${yesCount} going`);
  if (maybeCount > 0) rsvpParts.push(`${maybeCount} maybe`);
  const rsvpSummary =
    rsvpParts.length > 0 ? rsvpParts.join(" · ") : "no RSVPs yet";

  return (
    <Link
      href={`/meetups/${id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <WobblyCard
        tone="cream"
        className="flex gap-4 items-start transition-shadow"
      >
        {/* Date block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 52,
            padding: "6px 8px",
            background: "var(--color-clay-rust)",
            border: "1.5px solid var(--color-clay-ink)",
            borderRadius: 10,
            color: "var(--color-clay-cream)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.8rem",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {dayNum}
          </span>
          <span
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "0.75rem",
              lineHeight: 1,
              opacity: 0.9,
              marginTop: 2,
            }}
          >
            {shortMonth}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* Title */}
          <h3
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--color-clay-ink)",
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h3>

          {/* Friendly date */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              color: "var(--color-clay-ink-muted)",
              margin: 0,
            }}
          >
            {formatFriendlyDate(date)}
          </p>

          {/* Location + time */}
          <div
            className="flex items-center gap-1 flex-wrap"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--color-clay-ink)",
            }}
          >
            <DoodleIcon name="pot" size={14} color="var(--color-clay-rust)" />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "14ch",
              }}
            >
              {location}
            </span>
            <span style={{ color: "rgba(44,24,16,0.4)" }}>·</span>
            <span>{formatTime12h(time)}</span>
          </div>

          {/* RSVP summary */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              color:
                rsvpParts.length > 0
                  ? "var(--color-clay-sage)"
                  : "rgba(44,24,16,0.4)",
              margin: 0,
            }}
          >
            {rsvpSummary}
          </p>
        </div>
      </WobblyCard>
    </Link>
  );
}
