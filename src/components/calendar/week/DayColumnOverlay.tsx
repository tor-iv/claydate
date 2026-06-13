"use client";

import { useRouter } from "next/navigation";

interface DayColumnOverlayProps {
  dateISO: string;
}

const GRID_START_HOUR = 7; // 7:00 am
const GRID_END_HOUR = 23; // 11:00 pm
const GRID_HOURS = GRID_END_HOUR - GRID_START_HOUR; // 16

export default function DayColumnOverlay({ dateISO }: DayColumnOverlayProps) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only respond to direct clicks on the overlay (not on meetup blocks)
    const target = e.target as HTMLElement;
    if (target.closest("[data-meetup-block]")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const fraction = Math.max(0, Math.min(1, relY / rect.height));
    const minutesFromStart = fraction * GRID_HOURS * 60;
    const hour = Math.floor(minutesFromStart / 60) + GRID_START_HOUR;
    const clampedHour = Math.max(GRID_START_HOUR, Math.min(GRID_END_HOUR - 1, hour));
    const timeStr = String(clampedHour).padStart(2, "0") + ":00";
    router.push(`/meetups/new?date=${dateISO}&time=${timeStr}`);
  }

  return (
    <div
      onClick={handleClick}
      aria-label={`Add meetup on ${dateISO}`}
      style={{
        position: "absolute",
        inset: 0,
        cursor: "pointer",
        zIndex: 1,
      }}
    />
  );
}
