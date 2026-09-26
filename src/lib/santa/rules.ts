/** Store exclusion pairs with a_id < b_id so each pair is one row. Null for a self-pair. */
export function normalizeExclusion(a: string, b: string): [string, string] | null {
  if (a === b) return null;
  return a < b ? [a, b] : [b, a];
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written YYYY-MM-DD. */
export function isValidDeadline(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [, y, mo, d] = m.map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** "Sun, Dec 20" — parsed as UTC so the container's timezone can't shift the day. */
export function formatDeadline(s: string): string {
  const m = DATE_RE.exec(s);
  if (!m) return s;
  const [, y, mo, d] = m.map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
