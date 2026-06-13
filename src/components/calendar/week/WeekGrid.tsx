import Link from "next/link";
import DayColumnOverlay from "./DayColumnOverlay";
import MobileTodayScroll from "./MobileTodayScroll";
import { formatTime12h } from "@/lib/dates";

// Pottery studio hours: 7:00 am – 11:00 pm
const GRID_START = 7 * 60; // minutes since midnight = 420
const GRID_END = 23 * 60; // = 1380
const GRID_SPAN = GRID_END - GRID_START; // 960 minutes

const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

interface WeekMeetup {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
}

interface WeekGridProps {
  days: string[]; // 7 ISO date strings Sun→Sat
  meetups: WeekMeetup[];
  todayIso: string;
  nowMinutes: number; // current minutes since midnight (NYC)
  nowDateISO: string; // current date ISO in NYC
}

// Parse "HH:MM" → minutes since midnight
function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Build a flat list of hours 7..22 for the time gutter
const HOURS: number[] = [];
for (let h = GRID_START / 60; h < GRID_END / 60; h++) {
  HOURS.push(h);
}

// Compute top% and height% for an event block, clamping out-of-range meetups
function blockMetrics(startMin: number, durationMin: number) {
  const clampedStart = Math.max(GRID_START, Math.min(GRID_END - 1, startMin));
  const endMin = startMin + durationMin;
  const clampedEnd = Math.max(GRID_START + 1, Math.min(GRID_END, endMin));
  const topPct = ((clampedStart - GRID_START) / GRID_SPAN) * 100;
  const heightPct = ((clampedEnd - clampedStart) / GRID_SPAN) * 100;
  return { topPct, heightPct, clamped: startMin < GRID_START || endMin > GRID_END };
}

// Group meetups by date, then compute side-by-side layout for overlapping blocks
interface LayoutBlock {
  meetup: WeekMeetup;
  startMin: number;
  endMin: number;
  col: number;
  totalCols: number;
}

function layoutDayMeetups(dayMeetups: WeekMeetup[]): LayoutBlock[] {
  if (dayMeetups.length === 0) return [];
  const DURATION = 120; // 2 hours default

  // Sort by start time
  const sorted = [...dayMeetups].sort((a, b) => parseTime(a.time) - parseTime(b.time));

  // Simple n-way column assignment: group all overlapping as a cluster
  const blocks: LayoutBlock[] = sorted.map((m) => ({
    meetup: m,
    startMin: parseTime(m.time),
    endMin: parseTime(m.time) + DURATION,
    col: 0,
    totalCols: 1,
  }));

  // Find overlapping clusters and split width equally
  // Greedy column assignment
  const cols: number[] = []; // cols[i] = end time of last block in column i
  for (const block of blocks) {
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      if (cols[c] <= block.startMin) {
        block.col = c;
        cols[c] = block.endMin;
        placed = true;
        break;
      }
    }
    if (!placed) {
      block.col = cols.length;
      cols.push(block.endMin);
    }
  }

  // For each block, compute totalCols = max concurrent overlap
  const numCols = cols.length;
  for (const block of blocks) {
    // Find all blocks that overlap with this one
    const concurrent = blocks.filter(
      (b) => b.startMin < block.endMin && b.endMin > block.startMin
    );
    const maxCol = Math.max(...concurrent.map((b) => b.col));
    block.totalCols = maxCol + 1;
  }

  // Normalize totalCols to actual column count
  for (const block of blocks) {
    block.totalCols = numCols;
  }

  return blocks;
}

export default function WeekGrid({
  days,
  meetups,
  todayIso,
  nowMinutes,
  nowDateISO,
}: WeekGridProps) {
  // Group meetups by date
  const meetupsByDate: Record<string, WeekMeetup[]> = {};
  for (const m of meetups) {
    if (!meetupsByDate[m.date]) meetupsByDate[m.date] = [];
    meetupsByDate[m.date].push(m);
  }

  const todayColIndex = days.indexOf(todayIso);

  // Current-time line position (only rendered if today is in this week)
  const nowTopPct =
    nowMinutes >= GRID_START && nowMinutes <= GRID_END
      ? ((nowMinutes - GRID_START) / GRID_SPAN) * 100
      : null;

  return (
    <>
      <MobileTodayScroll todayColIndex={todayColIndex} />

      {/*
        Outer scroll container: on mobile this scrolls horizontally.
        The time gutter sticks to the left.
      */}
      <div
        id="week-grid-scroll"
        style={{
          overflowX: "auto",
          overflowY: "visible",
          // Prevent body overflow on mobile
          maxWidth: "100%",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
          border: "1.5px solid rgba(44,24,16,0.18)",
          borderRadius: 12,
          background: "rgba(245,240,232,0.7)",
          position: "relative",
        }}
      >
        {/* Inner flex: gutter + day columns */}
        <div style={{ display: "flex", minWidth: "max-content" }}>
          {/* ── Time gutter ─────────────────────────────────────────────── */}
          <div
            className="week-gutter"
            style={{
              position: "sticky",
              left: 0,
              zIndex: 10,
              background: "rgba(245,240,232,0.97)",
              borderRight: "1.5px solid rgba(44,24,16,0.12)",
              width: 52,
              flexShrink: 0,
            }}
          >
            {/* Header cell above gutter */}
            <div
              style={{
                height: 48,
                borderBottom: "1.5px solid rgba(44,24,16,0.15)",
              }}
            />

            {/* Hour labels */}
            <div style={{ position: "relative" }}>
              {HOURS.map((h) => {
                const topPct = ((h * 60 - GRID_START) / GRID_SPAN) * 100;
                const label = h === 0 ? "12 am" : h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`;
                return (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      top: `${topPct}%`,
                      left: 0,
                      right: 0,
                      transform: "translateY(-50%)",
                      textAlign: "right",
                      paddingRight: 6,
                      fontFamily: "var(--font-hand)",
                      fontSize: "0.62rem",
                      color: "var(--color-clay-ink-muted)",
                      lineHeight: 1,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  >
                    {label}
                  </div>
                );
              })}
              {/* Spacer to give height to the hours area */}
              <div style={{ height: `calc(${GRID_SPAN / 60} * var(--week-hour-height, 64px))` }} />
            </div>
          </div>

          {/* ── Day columns ──────────────────────────────────────────────── */}
          {days.map((iso, colIdx) => {
            const [y, mo, d] = iso.split("-").map(Number);
            const dt = new Date(y, mo - 1, d);
            const dayNum = d;
            const isToday = iso === todayIso;
            const dayMeetups = meetupsByDate[iso] ?? [];
            const layout = layoutDayMeetups(dayMeetups);
            const isNowDay = iso === nowDateISO;

            return (
              <div
                key={iso}
                style={{
                  width: "var(--week-col-width, 130px)",
                  minWidth: "var(--week-col-width, 130px)",
                  flexShrink: 0,
                  borderRight: colIdx < 6 ? "1px solid rgba(44,24,16,0.08)" : undefined,
                  scrollSnapAlign: "start",
                }}
              >
                {/* Day column header */}
                <div
                  style={{
                    height: 48,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    borderBottom: "1.5px solid rgba(44,24,16,0.15)",
                    background: isToday
                      ? "rgba(184,92,42,0.06)"
                      : "transparent",
                  }}
                >
                  {/* Weekday letter */}
                  <span
                    style={{
                      fontFamily: "var(--font-hand)",
                      fontSize: "0.65rem",
                      color: isToday
                        ? "var(--color-clay-rust)"
                        : "var(--color-clay-ink-muted)",
                      lineHeight: 1,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {DOW_SHORT[colIdx]}
                  </span>

                  {/* Day number — rust ring for today */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      fontFamily: "var(--font-body)",
                      fontSize: "0.88rem",
                      lineHeight: 1,
                      fontWeight: isToday ? 700 : 400,
                      color: isToday
                        ? "var(--color-clay-cream)"
                        : "var(--color-clay-ink)",
                      borderRadius: "50%",
                      background: isToday
                        ? "var(--color-clay-rust)"
                        : "transparent",
                      border: isToday
                        ? "1.5px solid var(--color-clay-ink)"
                        : "none",
                      flexShrink: 0,
                    }}
                  >
                    {dayNum}
                  </span>
                </div>

                {/* Hour grid body */}
                <div
                  style={{
                    position: "relative",
                    height: `calc(${GRID_SPAN / 60} * var(--week-hour-height, 64px))`,
                    background: isToday
                      ? "rgba(184,92,42,0.025)"
                      : "transparent",
                  }}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => {
                    const topPct = ((h * 60 - GRID_START) / GRID_SPAN) * 100;
                    return (
                      <div
                        key={h}
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          top: `${topPct}%`,
                          left: 0,
                          right: 0,
                          height: 1,
                          background: "rgba(44,24,16,0.08)",
                          pointerEvents: "none",
                        }}
                      />
                    );
                  })}

                  {/* Current-time line (only on today's column) */}
                  {isNowDay && nowTopPct !== null && (
                    <>
                      {/* Line */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          top: `${nowTopPct}%`,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: "var(--color-clay-rust)",
                          zIndex: 5,
                          pointerEvents: "none",
                        }}
                      />
                      {/* Dot */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          top: `${nowTopPct}%`,
                          left: -4,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "var(--color-clay-rust)",
                          border: "1.5px solid var(--color-clay-ink)",
                          transform: "translateY(-50%)",
                          zIndex: 6,
                          pointerEvents: "none",
                        }}
                      />
                    </>
                  )}

                  {/* Tap-to-create overlay (client component, sits below meetup blocks) */}
                  <DayColumnOverlay dateISO={iso} />

                  {/* Meetup blocks */}
                  {layout.map(({ meetup, startMin, endMin, col, totalCols }) => {
                    const { topPct, heightPct, clamped } = blockMetrics(startMin, endMin - startMin);
                    const isBeforeGrid = startMin < GRID_START;
                    const isAfterGrid = endMin > GRID_END;
                    const widthPct = 100 / totalCols;
                    const leftPct = col * widthPct;

                    return (
                      <Link
                        key={meetup.id}
                        href={`/meetups/${meetup.id}`}
                        data-meetup-block
                        title={meetup.title}
                        style={{
                          position: "absolute",
                          top: `${topPct}%`,
                          height: `max(${heightPct}%, 44px)`,
                          left: `${leftPct + 1}%`,
                          width: `${widthPct - 2}%`,
                          zIndex: 2,
                          textDecoration: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          padding: "3px 5px",
                          borderRadius: 6,
                          background: "var(--color-clay-cream)",
                          border: "1.5px solid var(--color-clay-rust)",
                          boxShadow: "1px 2px 0 rgba(44,24,16,0.14)",
                          borderLeft: "3px solid var(--color-clay-rust)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Clamp markers */}
                        {clamped && isBeforeGrid && (
                          <span
                            aria-label="starts before visible hours"
                            style={{
                              fontSize: "0.55rem",
                              color: "var(--color-clay-rust)",
                              lineHeight: 1,
                            }}
                          >
                            ↑
                          </span>
                        )}
                        <span
                          style={{
                            fontFamily: "var(--font-hand)",
                            fontSize: "0.72rem",
                            color: "var(--color-clay-ink)",
                            lineHeight: 1.2,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {meetup.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.62rem",
                            color: "var(--color-clay-ink-muted)",
                            lineHeight: 1,
                          }}
                        >
                          {formatTime12h(meetup.time)}
                        </span>
                        {clamped && isAfterGrid && (
                          <span
                            aria-label="ends after visible hours"
                            style={{
                              fontSize: "0.55rem",
                              color: "var(--color-clay-rust)",
                              lineHeight: 1,
                              marginTop: "auto",
                            }}
                          >
                            ↓
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
