import type { ReactNode } from "react";
import UserTag from "@/components/shared/UserTag";
import { formatShortEpoch } from "@/lib/dates";

export interface GalleryPhotoEntry {
  filename: string;
  caption: string | null;
  created_at: number;
  name: string;
  avatarShape: string;
  avatarGlaze: string;
  avatarPattern: string;
}

interface GalleryGridProps {
  photos: GalleryPhotoEntry[];
  /** Photo IDs alongside each photo for optional delete action */
  photoIds?: string[];
  /** The ID of the logged-in user (so they can delete their own photos) */
  currentUserId?: string;
  /** User IDs parallel to photos array, for ownership check */
  photoUserIds?: string[];
  /** Slot for a delete button component — rendered per photo if owner matches */
  deleteSlot?: (photoId: string) => ReactNode;
}

export default function GalleryGrid({
  photos,
  photoIds,
  currentUserId,
  photoUserIds,
  deleteSlot,
}: GalleryGridProps) {
  if (photos.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-12"
        style={{ textAlign: "center" }}
      >
        <span style={{ fontSize: "3rem" }} aria-hidden="true">🏺</span>
        <p
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "1.2rem",
            color: "rgba(44,24,16,0.5)",
          }}
        >
          no photos yet — make something pretty!
        </p>
      </div>
    );
  }

  return (
    <div
      className="columns-2 sm:columns-3 gap-3"
      style={{ columnGap: "12px" }}
    >
      {photos.map((photo, i) => {
        const photoId = photoIds?.[i];
        const photoUserId = photoUserIds?.[i];
        const isOwner = !!(
          currentUserId &&
          photoUserId &&
          currentUserId === photoUserId
        );

        return (
          <div
            key={photo.filename}
            className="break-inside-avoid mb-3"
          >
            {/* Polaroid-style card */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: "var(--color-clay-cream)",
                border: "2px solid var(--color-clay-ink)",
                boxShadow: "3px 4px 0px rgba(44,24,16,0.18), 1px 2px 8px rgba(44,24,16,0.06)",
                padding: "8px 8px 12px",
              }}
            >
              {/* Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/uploads/${photo.filename}`}
                alt={photo.caption ?? `photo by ${photo.name}`}
                loading="lazy"
                className="w-full rounded-lg"
                style={{ display: "block", objectFit: "cover" }}
              />

              {/* Caption + meta */}
              <div className="mt-2 flex flex-col gap-1.5">
                {photo.caption && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.85rem",
                      color: "var(--color-clay-ink)",
                      lineHeight: 1.45,
                      wordBreak: "break-word",
                    }}
                  >
                    {photo.caption}
                  </p>
                )}

                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <UserTag
                    user={{
                      name: photo.name,
                      avatarShape: photo.avatarShape,
                      avatarGlaze: photo.avatarGlaze,
                      avatarPattern: photo.avatarPattern,
                    }}
                    className="text-xs"
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      color: "rgba(92,61,46,0.5)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatShortEpoch(photo.created_at)}
                  </span>
                </div>

                {/* Delete button — only shown to owner, rendered via slot */}
                {isOwner && photoId && deleteSlot && (
                  <div className="flex justify-end mt-0.5">
                    {deleteSlot(photoId)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
