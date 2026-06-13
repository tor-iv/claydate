"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import HandInput from "@/components/ui/HandInput";
import InkButton from "@/components/ui/InkButton";

interface PhotoUploaderProps {
  meetupId: string;
}

export default function PhotoUploader({ meetupId }: PhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URL on cleanup to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function selectFile(file: File) {
    // Revoke previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  function resetForm() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCaption("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || pending) return;

    // Client-side size check for friendly error (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("that photo's a bit chunky — 5MB max!");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("meetupId", meetupId);
      if (caption.trim()) {
        fd.append("caption", caption.trim());
      }

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 413) {
          setError("that photo's a bit chunky — 5MB max!");
        } else if (res.status === 415) {
          setError("only jpeg, png, and webp photos please!");
        } else {
          setError(json.error ?? "something went wrong, try again?");
        }
        return;
      }

      resetForm();
      router.refresh();
    } catch {
      setError("couldn't upload — check your connection and try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Click or drag a photo to upload"
        onClick={() => !pending && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !pending) {
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative rounded-xl cursor-pointer transition-colors duration-150"
        style={{
          border: isDragging
            ? "2.5px dashed #B85C2A"
            : "2.5px dashed rgba(44,24,16,0.35)",
          background: isDragging
            ? "rgba(184,92,42,0.06)"
            : "rgba(245,240,232,0.7)",
          padding: previewUrl ? "12px" : "32px 16px",
          minHeight: previewUrl ? undefined : "120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {previewUrl ? (
          /* Preview */
          <div className="w-full flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview of selected photo"
              className="rounded-lg object-cover w-full"
              style={{ maxHeight: "220px", objectFit: "cover" }}
            />
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8rem",
                color: "rgba(92,61,46,0.6)",
              }}
            >
              tap to pick a different photo
            </p>
          </div>
        ) : (
          /* Placeholder */
          <>
            <span style={{ fontSize: "2rem" }} aria-hidden="true">🏺</span>
            <p
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1.1rem",
                color: "rgba(44,24,16,0.55)",
                textAlign: "center",
              }}
            >
              drag a photo here
              <br />
              <span style={{ fontSize: "0.9rem" }}>or tap to pick one</span>
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8rem",
                color: "rgba(92,61,46,0.45)",
              }}
            >
              jpeg · png · webp · max 5MB
            </p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleInputChange}
        disabled={pending}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Caption input (shown only after picking a file) */}
      {selectedFile && (
        <HandInput
          label="caption (optional)"
          placeholder="what did you make? ✨"
          value={caption}
          onChange={(e) => setCaption((e.target as HTMLInputElement).value)}
          maxLength={140}
          disabled={pending}
        />
      )}

      {/* Error message */}
      {error && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            color: "#B85C2A",
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Actions */}
      {selectedFile && (
        <div className="flex items-center gap-3 flex-wrap">
          <InkButton
            type="submit"
            variant="primary"
            disabled={pending}
          >
            {pending ? "glazing… 🏺" : "add to gallery"}
          </InkButton>
          <InkButton
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={resetForm}
          >
            cancel
          </InkButton>
        </div>
      )}
    </form>
  );
}
