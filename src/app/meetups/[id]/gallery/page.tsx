import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { meetups, gallery_photos, users } from "@/db/schema";
import { getCurrentUser, canEdit as canEditFn } from "@/lib/session";
import WobblyCard from "@/components/ui/WobblyCard";
import DoodleIcon from "@/components/ui/DoodleIcon";
import PhotoUploader from "@/components/gallery/PhotoUploader";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import DeletePhotoButton from "@/components/gallery/DeletePhotoButton";
import type { GalleryPhotoEntry } from "@/components/gallery/GalleryGrid";

interface GalleryPageProps {
  params: Promise<{ id: string }>;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { id } = await params;

  // Verify meetup exists
  const meetupRows = await db
    .select({ id: meetups.id, title: meetups.title })
    .from(meetups)
    .where(eq(meetups.id, id))
    .limit(1);

  if (meetupRows.length === 0) {
    notFound();
  }

  const meetup = meetupRows[0];

  // Fetch photos joined to users, newest first
  const photoRows = await db
    .select({
      id: gallery_photos.id,
      filename: gallery_photos.filename,
      caption: gallery_photos.caption,
      created_at: gallery_photos.created_at,
      user_id: gallery_photos.user_id,
      name: users.name,
      avatar_shape: users.avatar_shape,
      avatar_glaze: users.avatar_glaze,
      avatar_pattern: users.avatar_pattern,
    })
    .from(gallery_photos)
    .innerJoin(users, eq(gallery_photos.user_id, users.id))
    .where(eq(gallery_photos.meetup_id, id))
    .orderBy(desc(gallery_photos.created_at));

  const photos: GalleryPhotoEntry[] = photoRows.map((r) => ({
    filename: r.filename,
    caption: r.caption,
    created_at: r.created_at,
    name: r.name,
    avatarShape: r.avatar_shape,
    avatarGlaze: r.avatar_glaze,
    avatarPattern: r.avatar_pattern,
  }));

  const photoIds = photoRows.map((r) => r.id);
  const photoUserIds = photoRows.map((r) => r.user_id);

  const currentUser = await getCurrentUser();
  const currentUserId = currentUser?.userId;
  const userCanEdit = canEditFn(currentUser?.role);

  return (
    <main className="flex flex-col items-center px-4 py-8 sm:py-12 min-h-screen">
      <div className="w-full max-w-2xl mx-auto">
        {/* Back link */}
        <a
          href={`/meetups/${id}`}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            color: "var(--color-clay-rust)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            display: "inline-block",
            marginBottom: "1rem",
          }}
        >
          ← back to meetup
        </a>

        {/* Heading */}
        <h1
          className="leading-tight mb-6"
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "clamp(1.75rem, 6vw, 2.75rem)",
            fontWeight: 700,
            color: "#B85C2A",
          }}
        >
          what we made @ {meetup.title}
        </h1>

        {/* Upload section — friends only */}
        {currentUser && userCanEdit && (
          <WobblyCard tone="warm" className="mb-6">
            <h2
              className="mb-4 flex items-center gap-1.5"
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1.2rem",
                color: "#2C1810",
              }}
            >
              share a photo <DoodleIcon name="camera" size={18} color="#2C1810" />
            </h2>
            <PhotoUploader meetupId={id} />
          </WobblyCard>
        )}

        {currentUser && !userCanEdit && (
          <WobblyCard className="mb-6">
            <p
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.92rem",
                color: "var(--color-clay-ink-muted)",
                fontStyle: "italic",
              }}
            >
              friends can upload photos — ask for the password <DoodleIcon name="secret" size={16} color="var(--color-clay-ink-muted)" />
            </p>
          </WobblyCard>
        )}

        {!currentUser && (
          <WobblyCard className="mb-6">
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                color: "var(--color-clay-ink-muted)",
              }}
            >
              <a href="/login" style={{ color: "#B85C2A", textDecoration: "underline" }}>
                log in
              </a>{" "}
              to share your photos!
            </p>
          </WobblyCard>
        )}

        {/* Gallery grid */}
        <GalleryGrid
          photos={photos}
          photoIds={photoIds}
          currentUserId={currentUserId}
          photoUserIds={photoUserIds}
          deleteSlot={(photoId) => <DeletePhotoButton photoId={photoId} />}
        />
      </div>
    </main>
  );
}
