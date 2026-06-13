"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { meetups, comments } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function addCommentAction(
  meetupId: string,
  formData: FormData
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const body = (formData.get("body") ?? "").toString().trim();

  if (!body || body.length > 500) {
    // Silently ignore empty / too-long comments
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

  await db.insert(comments).values({
    id: nanoid(),
    meetup_id: meetupId,
    user_id: user.userId,
    body,
    created_at: Date.now(),
  });

  revalidatePath(`/meetups/${meetupId}`);
}
