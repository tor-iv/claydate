"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { meetups, rsvps } from "@/db/schema";
import { getCurrentUser, canEdit } from "@/lib/session";
import { DEFAULT_LOCATION } from "@/lib/constants";

export async function createMeetupAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!canEdit(user.role)) {
    redirect("/calendar");
  }

  const rawTitle = (formData.get("title") ?? "").toString().trim();
  const rawDate = (formData.get("date") ?? "").toString().trim();
  const rawTime = (formData.get("time") ?? "").toString().trim();
  const rawLocation = (formData.get("location") ?? "").toString().trim();
  const rawNote = (formData.get("note") ?? "").toString().trim();

  // Validate title
  if (!rawTitle || rawTitle.length > 80) {
    redirect(
      "/meetups/new?error=" +
        encodeURIComponent(
          rawTitle ? "Title must be 80 characters or fewer." : "Title can't be empty!"
        )
    );
  }

  // Validate date: must match YYYY-MM-DD and be a real calendar date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    redirect("/meetups/new?error=" + encodeURIComponent("Please pick a valid date!"));
  }
  const [y, m, d] = rawDate.split("-").map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    redirect("/meetups/new?error=" + encodeURIComponent("That date doesn't exist!"));
  }

  // Validate time
  if (!/^\d{2}:\d{2}$/.test(rawTime)) {
    redirect("/meetups/new?error=" + encodeURIComponent("Please pick a valid time!"));
  }

  // Location: fall back to default if empty
  const location = rawLocation || DEFAULT_LOCATION;
  if (location.length > 80) {
    redirect(
      "/meetups/new?error=" + encodeURIComponent("Location must be 80 characters or fewer.")
    );
  }

  // Note: optional, max 500
  const note = rawNote || null;
  if (note && note.length > 500) {
    redirect(
      "/meetups/new?error=" + encodeURIComponent("Note must be 500 characters or fewer.")
    );
  }

  const id = nanoid();
  const now = Date.now();

  await db.insert(meetups).values({
    id,
    title: rawTitle,
    location,
    date: rawDate,
    time: rawTime,
    note,
    created_by: user.userId,
    created_at: now,
  });

  // Creator auto-RSVPs "yes" — they're hosting!
  await db.insert(rsvps).values({
    id: nanoid(),
    meetup_id: id,
    user_id: user.userId,
    status: "yes",
    updated_at: now,
  });

  revalidatePath("/calendar");
  redirect(`/meetups/${id}`);
}
