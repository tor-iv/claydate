"use client";

import { useTransition } from "react";
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

  function handleClick() {
    startTransition(async () => {
      await deletePhotoAction(photoId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.75rem",
        color: isPending ? "rgba(92,61,46,0.4)" : "rgba(184,92,42,0.75)",
        background: "none",
        border: "none",
        cursor: isPending ? "not-allowed" : "pointer",
        padding: "2px 4px",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
      }}
    >
      {isPending ? "removing…" : "remove"}
    </button>
  );
}
