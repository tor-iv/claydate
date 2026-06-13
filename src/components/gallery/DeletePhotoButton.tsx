"use client";

import { useState, useTransition } from "react";
import { deletePhotoAction } from "@/actions/gallery";

interface DeletePhotoButtonProps {
  photoId: string;
}

/**
 * Tiny client component that wires deletePhotoAction to a button.
 * Only rendered for the photo's owner.
 */
export default function DeletePhotoButton({ photoId }: DeletePhotoButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        await deletePhotoAction(photoId);
      } catch (e) {
        console.error("photo delete failed", e);
        setFailed(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="remove this photo"
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.75rem",
        color: isPending
          ? "var(--color-clay-ink-muted)"
          : "var(--color-clay-rust)",
        opacity: isPending ? 0.5 : 0.85,
        background: "none",
        border: "none",
        cursor: isPending ? "not-allowed" : "pointer",
        padding: "2px 4px",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
      }}
    >
      {isPending ? "removing…" : failed ? "try again?" : "remove"}
    </button>
  );
}
