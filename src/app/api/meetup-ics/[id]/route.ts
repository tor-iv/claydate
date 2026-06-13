import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meetups } from "@/db/schema";
import { buildFeed } from "@/lib/ics";
import type { MeetupForIcs } from "@/lib/ics";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;

  const rows = await db
    .select()
    .from(meetups)
    .where(eq(meetups.id, id))
    .limit(1);

  if (rows.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  const r = rows[0];
  const meetup: MeetupForIcs = {
    id: r.id,
    title: r.title,
    location: r.location,
    date: r.date,
    time: r.time,
    note: r.note ?? null,
    created_at: r.created_at,
  };

  const icsBody = buildFeed([meetup]);

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="claydate-${id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
