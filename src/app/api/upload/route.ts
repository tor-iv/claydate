import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { meetups, gallery_photos } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { MAX_FILE_BYTES } from "@/lib/constants";
import { saveUploadedImage, UnsupportedFormatError } from "@/lib/image";

export async function POST(request: NextRequest) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const meetupId = formData.get("meetupId");

  // Validate required fields
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }
  if (!meetupId || typeof meetupId !== "string" || !meetupId.trim()) {
    return NextResponse.json({ ok: false, error: "Missing meetupId" }, { status: 400 });
  }

  const meetupIdStr = meetupId.trim();

  // Check file size BEFORE buffering (avoid reading a huge file into memory)
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File too large (max 5MB)" },
      { status: 413 }
    );
  }

  // Verify meetup exists
  const meetupRows = await db
    .select({ id: meetups.id })
    .from(meetups)
    .where(eq(meetups.id, meetupIdStr))
    .limit(1);

  if (meetupRows.length === 0) {
    return NextResponse.json({ ok: false, error: "Meetup not found" }, { status: 404 });
  }

  // Process and save the image
  let filename: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    filename = await saveUploadedImage(arrayBuffer);
  } catch (err) {
    if (err instanceof UnsupportedFormatError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 415 }
      );
    }
    console.error("[upload] sharp error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to process image" },
      { status: 500 }
    );
  }

  // Extract optional caption
  const rawCaption = formData.get("caption");
  let caption: string | null = null;
  if (rawCaption && typeof rawCaption === "string") {
    const trimmed = rawCaption.trim();
    if (trimmed.length > 0) {
      caption = trimmed.slice(0, 140);
    }
  }

  // Insert gallery_photos row
  await db.insert(gallery_photos).values({
    id: nanoid(),
    meetup_id: meetupIdStr,
    user_id: user.userId,
    filename,
    caption,
    created_at: Date.now(),
  });

  revalidatePath(`/meetups/${meetupIdStr}/gallery`);

  return NextResponse.json({ ok: true, filename });
}
