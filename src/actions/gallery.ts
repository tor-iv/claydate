"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { unlink } from "fs/promises";
import { join } from "path";
import { db } from "@/db";
import { gallery_photos } from "@/db/schema";
import { getCurrentUser, canEdit } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/constants";

/**
 * Delete a gallery photo.
 *
 * Only the photo's owner may delete it. Deletes both the DB row and the file
 * on disk. Missing-file errors are swallowed (silently logged) since the DB
 * row is the source of truth; we still want the row removed even if the file
 * is already gone.
 */
export async function deletePhotoAction(photoId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    // Not logged in — silently no-op (UI should not show the button)
    return;
  }
  if (!canEdit(user.role)) {
    return;
  }

  // Fetch the photo to verify ownership and get the filename
  const rows = await db
    .select({
      id: gallery_photos.id,
      user_id: gallery_photos.user_id,
      filename: gallery_photos.filename,
      meetup_id: gallery_photos.meetup_id,
    })
    .from(gallery_photos)
    .where(eq(gallery_photos.id, photoId))
    .limit(1);

  if (rows.length === 0) {
    // Photo already gone — nothing to do
    return;
  }

  const photo = rows[0];

  // Ownership check
  if (photo.user_id !== user.userId) {
    // Not the owner — refuse silently (no error surfaced to avoid info leak)
    return;
  }

  // Delete the DB row first so even if the file removal fails we don't orphan it
  await db.delete(gallery_photos).where(eq(gallery_photos.id, photoId));

  // Remove the file from disk, ignore missing-file errors
  try {
    await unlink(join(UPLOAD_DIR, photo.filename));
  } catch (err: unknown) {
    // ENOENT = file already gone, which is fine
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[gallery] failed to unlink file:", photo.filename, err);
    }
  }

  revalidatePath(`/meetups/${photo.meetup_id}/gallery`);
}
