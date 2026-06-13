"use client";

import { useEffect } from "react";

interface MobileTodayScrollProps {
  todayColIndex: number; // 0-6, or -1 if today not in this week
}

export default function MobileTodayScroll({ todayColIndex }: MobileTodayScrollProps) {
  useEffect(() => {
    if (todayColIndex < 0) return;

    const container = document.getElementById("week-grid-scroll");
    if (!container) return;

    // Each day column is min 130px; gutter is ~52px.
    // Scroll so today's column is roughly centered.
    const gutterWidth = 52;
    const colWidth = 130;
    const scrollTarget =
      gutterWidth + todayColIndex * colWidth - container.clientWidth / 2 + colWidth / 2;
    container.scrollLeft = Math.max(0, scrollTarget);
  }, [todayColIndex]);

  return null;
}
