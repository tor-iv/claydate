/**
 * ICS feed utilities for ClayDate.
 * RFC-5545 compliant iCalendar generation.
 * Pure module — no Next.js imports, safe for node test runners.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeetupForIcs {
  id: string;
  title: string;
  location: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM" America/New_York local
  note: string | null;
  created_at: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Text escaping (RFC 5545 §3.3.11)
// ---------------------------------------------------------------------------

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

// ---------------------------------------------------------------------------
// Line folding (RFC 5545 §3.1): fold at 75 octets
// ---------------------------------------------------------------------------

function foldLine(line: string): string {
  // Work in UTF-8 byte lengths
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);

  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder("utf-8");
  const chunks: string[] = [];
  let pos = 0;
  let first = true;

  while (pos < bytes.length) {
    const limit = first ? 75 : 74; // 74 after fold (1 byte for the leading space)
    let end = pos + limit;
    if (end >= bytes.length) {
      chunks.push(decoder.decode(bytes.slice(pos)));
      break;
    }
    // Back up to a valid UTF-8 boundary
    while (end > pos && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    chunks.push(decoder.decode(bytes.slice(pos, end)));
    pos = end;
    first = false;
  }

  return chunks.join("\r\n ");
}

function icsLine(name: string, value: string): string {
  return foldLine(`${name}:${value}`);
}

// ---------------------------------------------------------------------------
// Date/time helpers
// ---------------------------------------------------------------------------

/**
 * Parse "YYYY-MM-DD" + "HH:MM" as an America/New_York wall-clock time and
 * return the UTC Date object for that instant.
 *
 * Strategy: binary-search / Intl trick.
 * We construct a UTC instant, format it back to NY time, and adjust until
 * the formatted string matches our target. Because the offset is either -5 or
 * -4, we only need to try at most two offsets.
 */
function nyWallToUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Try EST (-5) then EDT (-4)
  for (const offsetH of [5, 4]) {
    const utcMs =
      Date.UTC(y, mo - 1, d, h + offsetH, m, 0);
    const candidate = new Date(utcMs);
    const parts = fmt.formatToParts(candidate);
    const p: Record<string, string> = {};
    for (const part of parts) p[part.type] = part.value;
    const cy = parseInt(p.year, 10);
    const cmo = parseInt(p.month, 10);
    const cd = parseInt(p.day, 10);
    const ch = parseInt(p.hour, 10);
    const cm = parseInt(p.minute, 10);
    if (cy === y && cmo === mo && cd === d && ch === h && cm === m) {
      return candidate;
    }
  }

  // Fallback: assume EST
  return new Date(Date.UTC(y, mo - 1, d, h + 5, m, 0));
}

/** Format a Date as ICS UTC timestamp: YYYYMMDDTHHMMSSZ */
function toUtcStamp(dt: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    pad(dt.getUTCFullYear(), 4) +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    "T" +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    "Z"
  );
}

/** Format a local-time NY wall-clock as ICS local-form: YYYYMMDDTHHMMSS */
function toLocalStamp(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    pad(y, 4) +
    pad(mo) +
    pad(d) +
    "T" +
    pad(h) +
    pad(m) +
    "00"
  );
}

/** Add 2 hours to a "YYYY-MM-DD" + "HH:MM" pair, rolling date if needed. */
function addTwoHours(date: string, time: string): { date: string; time: string } {
  const [y, mo, d] = date.split("-").map(Number);
  let [h, m] = time.split(":").map(Number);
  h += 2;
  let day = d;
  let month = mo;
  let year = y;
  if (h >= 24) {
    h -= 24;
    // Advance day by 1
    const dt = new Date(Date.UTC(y, mo - 1, d + 1));
    year = dt.getUTCFullYear();
    month = dt.getUTCMonth() + 1;
    day = dt.getUTCDate();
  }
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return {
    date: `${pad(year, 4)}-${pad(month)}-${pad(day)}`,
    time: `${pad(h)}:${pad(m)}`,
  };
}

// ---------------------------------------------------------------------------
// Static VTIMEZONE block for America/New_York (US DST rules)
// ---------------------------------------------------------------------------

const VTIMEZONE_NY = [
  "BEGIN:VTIMEZONE",
  "TZID:America/New_York",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

// ---------------------------------------------------------------------------
// VEVENT builder
// ---------------------------------------------------------------------------

export function buildMeetupVEvent(meetup: MeetupForIcs): string {
  const end = addTwoHours(meetup.date, meetup.time);

  const dtstamp = toUtcStamp(new Date(meetup.created_at));
  const dtstart = toLocalStamp(meetup.date, meetup.time);
  const dtend = toLocalStamp(end.date, end.time);

  const lines: string[] = [
    "BEGIN:VEVENT",
    icsLine("UID", `${meetup.id}@claydate`),
    icsLine("DTSTAMP", dtstamp),
    icsLine("DTSTART;TZID=America/New_York", dtstart),
    icsLine("DTEND;TZID=America/New_York", dtend),
    icsLine("SUMMARY", escapeText(meetup.title)),
    icsLine("LOCATION", escapeText(meetup.location)),
  ];

  if (meetup.note) {
    lines.push(icsLine("DESCRIPTION", escapeText(meetup.note)));
  }

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

// ---------------------------------------------------------------------------
// Full feed builder
// ---------------------------------------------------------------------------

export function buildFeed(meetupList: MeetupForIcs[]): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//claydate//ClayDate//EN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ClayDate 🏺",
    "X-WR-TIMEZONE:America/New_York",
    "CALSCALE:GREGORIAN",
  ].join("\r\n");

  const footer = "END:VCALENDAR";

  const parts = [header, VTIMEZONE_NY];
  for (const m of meetupList) {
    parts.push(buildMeetupVEvent(m));
  }
  parts.push(footer);

  return parts.join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------------------
// Feed token: first 20 hex chars of HMAC-SHA256(SESSION_SECRET, "claydate-ics-feed")
// ---------------------------------------------------------------------------

export function feedToken(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET not set");
  }
  const hmac = createHmac("sha256", secret);
  hmac.update("claydate-ics-feed");
  return hmac.digest("hex").slice(0, 20);
}

/**
 * Constant-time token comparison.
 * Returns true if the provided token matches feedToken().
 */
export function tokenMatches(provided: string): boolean {
  const expected = feedToken();
  if (provided.length !== expected.length) {
    // Still run timingSafeEqual to avoid early-exit info leak on length
    // Compare expected against itself so we always do the same work
    timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(expected, "utf8"));
    return false;
  }
  return timingSafeEqual(
    Buffer.from(provided, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

// ---------------------------------------------------------------------------
// Google Calendar URL
// ---------------------------------------------------------------------------

export function googleCalendarUrl(meetup: MeetupForIcs): string {
  const startUtc = nyWallToUtc(meetup.date, meetup.time);
  const end = addTwoHours(meetup.date, meetup.time);
  const endUtc = nyWallToUtc(end.date, end.time);

  const startStr = toUtcStamp(startUtc).replace("Z", "Z"); // already has Z
  const endStr = toUtcStamp(endUtc).replace("Z", "Z");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: meetup.title,
    dates: `${startStr}/${endStr}`,
    location: meetup.location,
  });

  if (meetup.note) {
    params.set("details", meetup.note);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
