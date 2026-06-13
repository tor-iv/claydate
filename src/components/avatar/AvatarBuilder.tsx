"use client";

import { useState } from "react";
import VaseAvatar from "./VaseAvatar";
import {
  AVATAR_SHAPES,
  AVATAR_GLAZES,
  AVATAR_PATTERNS,
  DEFAULT_AVATAR,
} from "@/lib/avatars";
import type { AvatarShape, AvatarGlaze, AvatarPattern } from "@/lib/avatars";

interface AvatarBuilderProps {
  defaultShape?:   AvatarShape;
  defaultGlaze?:   AvatarGlaze;
  defaultPattern?: AvatarPattern;
  /** If true, renders hidden inputs for form submission */
  formMode?: boolean;
}

export default function AvatarBuilder({
  defaultShape   = DEFAULT_AVATAR.shape,
  defaultGlaze   = DEFAULT_AVATAR.glaze,
  defaultPattern = DEFAULT_AVATAR.pattern,
  formMode = true,
}: AvatarBuilderProps) {
  const [shape,   setShape]   = useState<AvatarShape>(defaultShape);
  const [glaze,   setGlaze]   = useState<AvatarGlaze>(defaultGlaze);
  const [pattern, setPattern] = useState<AvatarPattern>(defaultPattern);

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden inputs for form submission */}
      {formMode && (
        <>
          <input type="hidden" name="avatarShape"   value={shape} />
          <input type="hidden" name="avatarGlaze"   value={glaze} />
          <input type="hidden" name="avatarPattern" value={pattern} />
        </>
      )}

      {/* Live preview */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative p-4 rounded-full"
          style={{ background: "rgba(232,213,176,0.4)" }}
        >
          <div
            className="animate-pop-in"
            key={`${shape}-${glaze}-${pattern}`}
            style={{ display: "block" }}
          >
            <VaseAvatar shape={shape} glaze={glaze} pattern={pattern} size={96} />
          </div>
        </div>
        <span
          className="text-sm"
          style={{ fontFamily: "var(--font-hand)", color: "var(--color-clay-ink-muted)" }}
        >
          your clay friend
        </span>
      </div>

      {/* Shape picker */}
      <section>
        <h4
          className="text-sm mb-2 tracking-wide"
          style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
        >
          Shape
        </h4>
        <div className="flex flex-wrap gap-2">
          {AVATAR_SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShape(s.id)}
              aria-label={s.label}
              className="relative flex flex-col items-center gap-1 p-2 rounded-lg transition-transform"
              style={{
                background: shape === s.id ? "rgba(184,92,42,0.12)" : "rgba(232,213,176,0.3)",
                border: shape === s.id
                  ? "2px solid #2C1810"
                  : "2px solid transparent",
                transform: shape === s.id ? "scale(1.08)" : "scale(1)",
                cursor: "pointer",
              }}
            >
              <VaseAvatar shape={s.id} glaze={glaze} pattern={pattern} size={40} />
              <span
                className="text-xs leading-none"
                style={{ fontFamily: "var(--font-hand)", color: "var(--color-clay-ink-muted)" }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Glaze picker */}
      <section>
        <h4
          className="text-sm mb-2 tracking-wide"
          style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
        >
          Glaze
        </h4>
        <div className="flex flex-wrap gap-3">
          {AVATAR_GLAZES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGlaze(g.id)}
              title={g.label}
              className="relative transition-transform"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: g.fill,
                border: glaze === g.id ? "2.5px solid #2C1810" : "2px solid rgba(44,24,16,0.25)",
                transform: glaze === g.id ? "scale(1.15)" : "scale(1)",
                cursor: "pointer",
                boxShadow: glaze === g.id ? "0 0 0 3px rgba(44,24,16,0.15)" : "none",
              }}
              aria-label={g.label}
              aria-pressed={glaze === g.id}
            />
          ))}
        </div>
      </section>

      {/* Pattern picker */}
      <section>
        <h4
          className="text-sm mb-2 tracking-wide"
          style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
        >
          Pattern
        </h4>
        <div className="flex flex-wrap gap-2">
          {AVATAR_PATTERNS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPattern(p.id)}
              aria-label={p.label}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-transform"
              style={{
                background: pattern === p.id ? "rgba(184,92,42,0.12)" : "rgba(232,213,176,0.3)",
                border: pattern === p.id ? "2px solid #2C1810" : "2px solid transparent",
                transform: pattern === p.id ? "scale(1.08)" : "scale(1)",
                cursor: "pointer",
              }}
              aria-pressed={pattern === p.id}
            >
              <VaseAvatar shape={shape} glaze={glaze} pattern={p.id} size={32} />
              <span
                className="text-xs leading-none"
                style={{ fontFamily: "var(--font-hand)", color: "var(--color-clay-ink-muted)" }}
              >
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
