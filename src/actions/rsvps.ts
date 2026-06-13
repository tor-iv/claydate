"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { meetups, rsvps } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

const VALID_STATUSES = ["yes", "no", "maybe"] as const;
type RsvpStatus = (typeof VALID_STATUSES)[number];

export async function upsertRsvpAction(
  meetupId: string,
  status: RsvpStatus
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Validate status against the literal union at runtime
  if (!VALID_STATUSES.includes(status)) {
    return;
  }

  // Validate meetup exists
  const meetupRows = await db
    .select({ id: meetups.id })
    .from(meetups)
    .where(eq(meetups.id, meetupId))
    .limit(1);

  if (meetupRows.length === 0) {
    return;
  }

  const now = Date.now();

  await db
    .insert(rsvps)
    .values({
      id: nanoid(),
      meetup_id: meetupId,
      user_id: user.userId,
      status,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: [rsvps.meetup_id, rsvps.user_id],
      set: {
        status,
        updated_at: now,
      },
    });

  revalidatePath(`/meetups/${meetupId}`);
  revalidatePath("/calendar");
}
