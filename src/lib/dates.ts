/**
 * Date utilities for ClayDate.
 * All "today" logic uses America/New_York explicitly — the server runs UTC
 * but the studio is in NYC.
 */

const NYC_TZ = "America/New_York";

/** Returns today's date as "YYYY-MM-DD" in NYC timezone. */
export function todayISO(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: NYC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA locale formats as YYYY-MM-DD natively
  return fmt.format(new Date());
}

/** Returns the current month as "YYYY-MM" in NYC timezone. */
export function currentMonthParam(): string {
  return todayISO().slice(0, 7);
}

/** Returns true if s is a valid "YYYY-MM" string with month 01–12. */
export function isValidMonthParam(s: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) return false;
  return true;
}

/**
 * Returns a 2D array (weeks × 7 days) of ISO date strings for the given
 * year/month. Null for leading/trailing blanks. Weeks start SUNDAY.
 *
 * @param year  Full year, e.g. 2026
 * @param month 1-based month, e.g. 6 for June
 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  // First day of month
  const firstDate = new Date(year, month - 1, 1);
  const firstDow = firstDate.getDay(); // 0=Sun … 6=Sat

  // Last day of month
  const lastDay = new Date(year, month, 0).getDate();

  // Build flat array: nulls for leading blanks, then ISO strings, then trailing nulls
  const totalCells = Math.ceil((firstDow + lastDay) / 7) * 7;
  const flat: (string | null)[] = [];

  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDow + 1;
    if (dayNum < 1 || dayNum > lastDay) {
      flat.push(null);
    } else {
      const mm = String(month).padStart(2, "0");
      const dd = String(dayNum).padStart(2, "0");
      flat.push(`${year}-${mm}-${dd}`);
    }
  }

  // Split into weeks of 7
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) {
    weeks.push(flat.slice(i, i + 7));
  }
  return weeks;
}

/**
 * Formats a "YYYY-MM" param as a human-readable month name, e.g. "June 2026".
 * Falls back gracefully if param is malformed.
 */
export function formatMonthName(param: string): string {
  const [yearStr, monthStr] = param.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return param;
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/** Returns the "YYYY-MM" of the month before the given param. */
export function prevMonthParam(param: string): string {
  const [yearStr, monthStr] = param.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Returns the "YYYY-MM" of the month after the given param. */
export function nextMonthParam(param: string): string {
  const [yearStr, monthStr] = param.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Formats an ISO date string as a friendly label, e.g. "Sat, Jun 20".
 */
export function formatFriendlyDate(iso: string): string {
  const [yearStr, monthStr, dayStr] = iso.split("-");
  const d = new Date(
    parseInt(yearStr, 10),
    parseInt(monthStr, 10) - 1,
    parseInt(dayStr, 10)
  );
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats an epoch-ms timestamp as a short label, e.g. "Jun 12".
 * Rendered in NY time so comment/photo dates match the studio's clock.
 */
export function formatShortEpoch(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

/**
 * Formats an ISO date string as a long label, e.g. "Saturday, June 20".
 * Built from a UTC-noon timestamp so a UTC server can never flip the day.
 */
export function formatLongDate(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formats a 24h time string "HH:MM" as 12h with am/pm, e.g. "6:00 pm".
 */
export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
}

// ── Week-view utilities ────────────────────────────────────────────────────

/**
 * Returns the ISO date of the SUNDAY that starts the current NYC week.
 * Uses pure date-part arithmetic — safe across DST transitions.
 */
export function currentWeekParam(): string {
  const today = todayISO(); // "YYYY-MM-DD" in NYC
  const [y, mo, d] = today.split("-").map(Number);
  // Date constructor with three args creates a LOCAL (server) midnight, but we
  // only need the day-of-week; calling getDay() on a Date built from numeric
  // parts is equivalent to any calendar arithmetic — we just subtract the DOW.
  const dt = new Date(y, mo - 1, d);
  const dow = dt.getDay(); // 0 = Sun
  const sunDay = d - dow;
  const sun = new Date(y, mo - 1, sunDay);
  const sy = sun.getFullYear();
  const sm = String(sun.getMonth() + 1).padStart(2, "0");
  const sd = String(sun.getDate()).padStart(2, "0");
  return `${sy}-${sm}-${sd}`;
}

/** Returns true if s is a valid ISO date string AND falls on a Sunday. */
export function isValidWeekParam(s: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s)) return false;
  const [y, mo, d] = s.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  // Verify the date round-trips (catches invalid dates like Feb 30)
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() + 1 !== mo ||
    dt.getDate() !== d
  ) {
    return false;
  }
  return dt.getDay() === 0; // must be Sunday
}

/**
 * Returns an array of 7 ISO date strings (Sun → Sat) for the week starting
 * at weekParam. Uses pure date-part arithmetic — safe across DST.
 */
export function weekDays(weekParam: string): string[] {
  const [y, mo, d] = weekParam.split("-").map(Number);
  const result: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(y, mo - 1, d + i);
    const wy = dt.getFullYear();
    const wm = String(dt.getMonth() + 1).padStart(2, "0");
    const wd = String(dt.getDate()).padStart(2, "0");
    result.push(`${wy}-${wm}-${wd}`);
  }
  return result;
}

/** Returns the weekParam for the previous week (7 days before). */
export function prevWeekParam(weekParam: string): string {
  const [y, mo, d] = weekParam.split("-").map(Number);
  const dt = new Date(y, mo - 1, d - 7);
  const py = dt.getFullYear();
  const pm = String(dt.getMonth() + 1).padStart(2, "0");
  const pd = String(dt.getDate()).padStart(2, "0");
  return `${py}-${pm}-${pd}`;
}

/** Returns the weekParam for the next week (7 days after). */
export function nextWeekParam(weekParam: string): string {
  const [y, mo, d] = weekParam.split("-").map(Number);
  const dt = new Date(y, mo - 1, d + 7);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, "0");
  const nd = String(dt.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

/**
 * Returns a human-friendly label for the week range, e.g.:
 *   "Jun 14 – 20"  (same month)
 *   "Jun 28 – Jul 4"  (cross-month)
 */
export function weekRangeLabel(weekParam: string): string {
  const days = weekDays(weekParam);
  const sun = days[0];
  const sat = days[6];

  const fmt = (iso: string, showMonth: boolean) => {
    const [y, mo, d] = iso.split("-").map(Number);
    const dt = new Date(y, mo - 1, d);
    if (showMonth) {
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return String(dt.getDate());
  };

  const [sunY, sunM] = sun.split("-").map(Number);
  const [satY, satM] = sat.split("-").map(Number);
  const crossMonth = sunM !== satM || sunY !== satY;

  const sunLabel = fmt(sun, true);
  const satLabel = fmt(sat, crossMonth);
  return `${sunLabel} – ${satLabel}`;
}

/**
 * Returns the current NYC date and minutes-since-midnight.
 * Used to position the current-time indicator in WeekGrid.
 */
export function nowInNY(): { dateISO: string; minutesSinceMidnight: number } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: NYC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = parseInt(get("hour"), 10);
  const minute = parseInt(get("minute"), 10);
  const dateISO = `${year}-${month}-${day}`;
  const minutesSinceMidnight = hour * 60 + minute;
  return { dateISO, minutesSinceMidnight };
}
