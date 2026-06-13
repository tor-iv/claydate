import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetups } from "@/db/schema";
import { sql } from "drizzle-orm";
import { buildFeed, tokenMatches } from "@/lib/ics";
import type { MeetupForIcs } from "@/lib/ics";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { token } = await context.params;

  if (!tokenMatches(token)) {
    return new NextResponse(null, { status: 404 });
  }

  // date >= 60 days ago (so recently-past events stick around in subscribed calendars)
  const sixtyDaysAgoMs = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = new Date(sixtyDaysAgoMs).toISOString().slice(0, 10); // "YYYY-MM-DD"

  const rows = await db
    .select()
    .from(meetups)
    .where(sql`${meetups.date} >= ${sixtyDaysAgo}`)
    .orderBy(meetups.date);

  const meetupList: MeetupForIcs[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    location: r.location,
    date: r.date,
    time: r.time,
    note: r.note ?? null,
    created_at: r.created_at,
  }));

  const icsBody = buildFeed(meetupList);

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=\"claydate.ics\"",
      "Cache-Control": "public, max-age=300",
    },
  });
}
