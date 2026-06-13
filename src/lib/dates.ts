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
