/**
 * AddToCalendar — server-renderable links for exporting a meetup to a calendar.
 * Renders two compact ghost-style links plus a subscribe disclosure.
 */

import { googleCalendarUrl } from "@/lib/ics";
import type { MeetupForIcs } from "@/lib/ics";
import DoodleIcon from "@/components/ui/DoodleIcon";

interface AddToCalendarProps {
  meetup: MeetupForIcs;
  /** Full webcal URL: webcal://<host>/api/feed/<token> */
  feedUrl: string;
}

export default function AddToCalendar({ meetup, feedUrl }: AddToCalendarProps) {
  const gcalUrl = googleCalendarUrl(meetup);
  const icsUrl = `/api/meetup-ics/${meetup.id}`;

  return (
    <div
      className="flex flex-col gap-3"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Add-to-calendar buttons row */}
      <div className="flex flex-wrap gap-2">
        <a
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
          style={{
            fontFamily: "var(--font-hand)",
            color: "var(--color-clay-ink)",
            background: "transparent",
            border: "2px solid rgba(44,24,16,0.5)",
            textDecoration: "none",
            boxShadow: "1px 2px 0px rgba(44,24,16,0.18)",
            lineHeight: 1.2,
          }}
        >
          <DoodleIcon name="calendar" size={16} color="var(--color-clay-ink)" />
          add to google cal
        </a>

        <a
          href={icsUrl}
          download={`claydate-${meetup.id}.ics`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
          style={{
            fontFamily: "var(--font-hand)",
            color: "var(--color-clay-ink)",
            background: "transparent",
            border: "2px solid rgba(44,24,16,0.5)",
            textDecoration: "none",
            boxShadow: "1px 2px 0px rgba(44,24,16,0.18)",
            lineHeight: 1.2,
          }}
        >
          <DoodleIcon name="apple" size={16} color="var(--color-clay-ink)" />
          .ics for apple / outlook
        </a>
      </div>

      {/* Subscribe to all meetups disclosure */}
      <details
        className="rounded-lg"
        style={{
          border: "1px dashed rgba(44,24,16,0.25)",
          background: "rgba(44,24,16,0.03)",
        }}
      >
        <summary
          className="px-3 py-2 cursor-pointer text-sm select-none flex items-center gap-1.5"
          style={{
            fontFamily: "var(--font-hand)",
            color: "rgba(92,61,46,0.75)",
            listStyle: "none",
          }}
        >
          <DoodleIcon name="calendar" size={15} color="rgba(92,61,46,0.75)" /> subscribe to all meetups
        </summary>
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
          <code
            className="block px-2 py-1.5 rounded text-xs break-all"
            style={{
              fontFamily: "monospace",
              background: "rgba(232,213,176,0.5)",
              border: "1px solid rgba(44,24,16,0.15)",
              color: "#2C1810",
              userSelect: "all",
            }}
          >
            {feedUrl}
          </code>
          <p
            className="text-xs"
            style={{
              color: "var(--color-clay-ink-muted)",
              lineHeight: 1.5,
            }}
          >
            paste into <strong>Google Calendar → Other calendars → From URL</strong>,
            or just tap on iPhone to subscribe automatically.
          </p>
        </div>
      </details>
    </div>
  );
}
