"use client";

import React, { useState, useRef, useEffect } from "react";
import VaseAvatar from "./VaseAvatar";
import FaceDrawPad from "./FaceDrawPad";
import {
  AVATAR_SHAPES,
  AVATAR_GLAZES,
  AVATAR_PATTERNS,
  DEFAULT_AVATAR,
  encodeThrown2Shape,
  buildThrown2Path,
  bandsForHeight,
  resampleWidths,
  DEFAULT_THROWN2_WIDTHS,
  DEFAULT_THROWN2_H,
  parseFaceDrawing,
  parseMiiFace,
  encodeMiiFace,
  DEFAULT_MII_FACE,
  MII_EYES_COUNT,
  MII_BROWS_COUNT,
  MII_MOUTH_COUNT,
  MII_CHEEKS_COUNT,
  MII_ACCESSORY_IDS,
  resolveGlaze,
  DEFAULT_FACE_TRANSFORM,
} from "@/lib/avatars";
import type {
  AvatarShape,
  AvatarGlaze,
  AvatarPattern,
  FaceId,
  MiiFace,
  FaceTransform,
} from "@/lib/avatars";
import {
  EYE_PARTS,
  BROW_PARTS,
  MOUTH_PARTS,
  CHEEK_PARTS,
  ACCESSORY_PARTS,
} from "@/lib/faceParts";
import DoodleIcon from "@/components/ui/DoodleIcon";

interface AvatarBuilderProps {
  defaultShape?:   AvatarShape;
  defaultGlaze?:   AvatarGlaze;
  defaultPattern?: AvatarPattern;
  /** If true, renders hidden inputs for form submission */
  formMode?: boolean;
}

// ── Wheel shimmer animation keyframes (component-scoped) ──────────────────
const WHEEL_STYLE = `
@keyframes wheelSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes highlightSweep {
  0%   { stroke-dashoffset: 0;   opacity: 0.7; }
  50%  { stroke-dashoffset: -40; opacity: 0.4; }
  100% { stroke-dashoffset: -80; opacity: 0.7; }
}
@keyframes highlightSweep2 {
  0%   { stroke-dashoffset: -20; opacity: 0.5; }
  50%  { stroke-dashoffset: -60; opacity: 0.2; }
  100% { stroke-dashoffset: -100; opacity: 0.5; }
}
@keyframes wheelGlow {
  0%   { opacity: 0.4; }
  50%  { opacity: 0.7; }
  100% { opacity: 0.4; }
}
`;

// Slightly randomize params for "surprise me" (thrown2)
function randomThrown2Params(): {
  h: number;
  widths: number[];
  edge: number;
  glaze: AvatarGlaze;
  face: FaceId | string;
} {
  const h = 0.2 + Math.random() * 0.8;
  const n = bandsForHeight(h);
  const widths = Array.from({ length: n }, () => 0.2 + Math.random() * 0.8);
  const edge = Math.random() < 0.3 ? Math.random() : 0;

  const glaze = AVATAR_GLAZES[Math.floor(Math.random() * AVATAR_GLAZES.length)].id;

  // Face: 60% chance of mii face, 30% preset, 10% none
  const MII_PALETTE = ["#2C1810", "#B84C2A", "#5B8EC4", "#D4847A", "#6B8F6A", "#C9901A"];
  let face: FaceId | string;
  const faceRoll = Math.random();
  if (faceRoll < 0.6) {
    const accessory = Math.random() < 0.55
      ? "none"
      : MII_ACCESSORY_IDS[Math.floor(Math.random() * MII_ACCESSORY_IDS.length)];
    const mii: MiiFace = {
      eyes:      Math.floor(Math.random() * MII_EYES_COUNT),
      brows:     Math.floor(Math.random() * MII_BROWS_COUNT),
      mouth:     Math.floor(Math.random() * MII_MOUTH_COUNT),
      cheeks:    Math.floor(Math.random() * MII_CHEEKS_COUNT),
      accessory,
      ink:       MII_PALETTE[Math.floor(Math.random() * MII_PALETTE.length)],
    };
    face = encodeMiiFace(mii);
  } else if (faceRoll < 0.9) {
    const faces: FaceId[] = ["happy", "sleepy", "winky", "surprised"];
    face = faces[Math.floor(Math.random() * faces.length)];
  } else {
    face = "none";
  }

  return { h, widths, edge, glaze, face };
}

// ── WheelVasePreview ──────────────────────────────────────────────────────
// Fluid pottery-wheel sculpting area using Gaussian neighbor falloff drag.

interface WheelVasePreviewProps {
  h: number;
  widths: number[];
  glaze: string;
  pattern: AvatarPattern;
  face: FaceId | string;
  edge: number;
  faceT?: FaceTransform;
  /** Live sculpt during a drag: set height + widths together, no band-count resample. */
  onSculpt: (h: number, widths: number[]) => void;
  /** Drag released: settle the band count to the height's natural value. */
  onSculptEnd: () => void;
}

function WheelVasePreview({
  h,
  widths,
  glaze,
  pattern,
  face,
  edge,
  faceT,
  onSculpt,
  onSculptEnd,
}: WheelVasePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startH: number;
    startWidths: number[];
    activeBandIndex: number;
    relYAtDown: number;
    hasDragged: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startH: h,
    startWidths: widths.slice(),
    activeBandIndex: 0,
    relYAtDown: 0.5,
    hasDragged: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const PREVIEW_SIZE = 220;
  const DRAG_THRESHOLD = 4; // pixels — must move at least this far to count as a drag

  function getRelativePos(e: React.PointerEvent): { relX: number; relY: number } {
    if (!containerRef.current) return { relX: 0.5, relY: 0.5 };
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    return { relX, relY };
  }

  function bandIndexForRelY(relY: number, n: number): number {
    const t = 1 - relY; // 0=foot, 1=lip
    const idx = Math.round(t * (n - 1));
    return Math.max(0, Math.min(n - 1, idx));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    try { el.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ }

    const { relY } = getRelativePos(e);
    const n = widths.length;
    const activeBandIndex = bandIndexForRelY(relY, n);

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startH: h,
      startWidths: widths.slice(),
      activeBandIndex,
      relYAtDown: relY,
      hasDragged: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;

    const totalDx = e.clientX - dragRef.current.startX;
    const totalDy = e.clientY - dragRef.current.startY;
    const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

    if (!dragRef.current.hasDragged && totalDist > DRAG_THRESHOLD) {
      dragRef.current.hasDragged = true;
      setIsDragging(true);
    }

    if (!dragRef.current.hasDragged) return;

    e.preventDefault();

    const startWidths = dragRef.current.startWidths;
    const startBands = startWidths.length;
    const active = dragRef.current.activeBandIndex;

    // Axis-proportional gains: a mostly-vertical drag is mostly height, a
    // mostly-horizontal drag is mostly width — so the two never fight each
    // other and the motion feels intentional rather than twitchy.
    const adx = Math.abs(totalDx);
    const ady = Math.abs(totalDy);
    const mag = adx + ady + 0.0001;
    const wGain = 0.3 + 0.7 * (adx / mag); // 0.3 .. 1.0
    const hGain = 0.3 + 0.7 * (ady / mag);

    // Height — global, eased by the vertical share of the gesture.
    const hDelta = (-totalDy / PREVIEW_SIZE) * 1.5 * hGain;
    const newH = Math.max(0, Math.min(1, dragRef.current.startH + hDelta));

    // Width — a clay "pull" centered on the grabbed band, falling off to its
    // neighbors with a Gaussian so the wall bulges smoothly like real clay
    // being drawn up, instead of one band kinking out on its own.
    const wPull = (totalDx / PREVIEW_SIZE) * 2.0 * wGain;
    const sigma = Math.max(0.75, (startBands - 1) * 0.4);
    const twoSigSq = 2 * sigma * sigma;
    const newWidths = startWidths.map((w, i) => {
      const influence = Math.exp(-((i - active) ** 2) / twoSigSq);
      // Floor at 0.06 so the pot never pinches to a vanishing thread.
      return Math.max(0.06, Math.min(1, w + wPull * influence));
    });

    // Set height + widths together at a FIXED band count — no mid-drag
    // resampling, which is what used to make the height drag jump.
    onSculpt(newH, newWidths);
  }

  function handlePointerUp() {
    if (!dragRef.current.active) return;
    const didDrag = dragRef.current.hasDragged;
    dragRef.current.active = false;
    dragRef.current.hasDragged = false;
    setIsDragging(false);
    // Settle the band count to the final height's natural value once, on release.
    if (didDrag) onSculptEnd();
  }

  function handlePointerCancel() {
    dragRef.current.active = false;
    dragRef.current.hasDragged = false;
    setIsDragging(false);
  }

  const N = widths.length;
  const shapeStr = encodeThrown2Shape(h, widths, face as FaceId, edge, faceT);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        role="img"
        aria-label="Drag to sculpt your vase"
      >
        {/* Vase avatar */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <VaseAvatar
            shape={shapeStr}
            glaze={glaze}
            pattern={pattern}
            size={PREVIEW_SIZE - 20}
          />
          {/* Animated highlight streaks */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 3,
            }}
            width={PREVIEW_SIZE - 20}
            height={PREVIEW_SIZE - 20}
            viewBox="0 0 64 64"
            fill="none"
          >
            <path
              d={buildThrown2Path(h, widths, edge)}
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="8 52"
              strokeDashoffset="0"
              style={{ animation: "highlightSweep 2.1s linear infinite" }}
            />
            <path
              d={buildThrown2Path(h, widths, edge)}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="5 60"
              strokeDashoffset="-20"
              style={{ animation: "highlightSweep2 3.3s linear infinite" }}
            />
          </svg>
        </div>

        {/* Band count indicator */}
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            fontFamily: "var(--font-hand)",
            fontSize: "0.68rem",
            color: "#B85C2A",
            background: "rgba(245,240,232,0.82)",
            border: "1px dashed #B85C2A",
            borderRadius: 4,
            padding: "1px 5px",
            pointerEvents: "none",
            opacity: isDragging ? 0.6 : 0.9,
            zIndex: 10,
          }}
        >
          {N} bands
        </div>
      </div>

      {/* Wheel base */}
      <div style={{ position: "relative", marginTop: -8, zIndex: 1 }}>
        <svg
          width={PREVIEW_SIZE + 20}
          height={40}
          viewBox="0 0 200 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="100" cy="32" rx="85" ry="7" fill="rgba(44,24,16,0.12)" />
          <ellipse cx="100" cy="22" rx="78" ry="14" fill="#5C3D2E" />
          <ellipse cx="100" cy="18" rx="78" ry="12" fill="#7A5540" />
          <g style={{ transformOrigin: "100px 18px", animation: "wheelSpin 3s linear infinite" }}>
            {[0, 45, 90, 135].map((angle) => (
              <line
                key={angle}
                x1="100"
                y1="18"
                x2={100 + Math.cos((angle * Math.PI) / 180) * 68}
                y2={18 + Math.sin((angle * Math.PI) / 180) * 10}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
            ))}
            <ellipse cx="100" cy="18" rx="30" ry="5" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
            <ellipse cx="100" cy="18" rx="55" ry="9" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" />
          </g>
          <ellipse cx="100" cy="15" rx="78" ry="12" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
          <ellipse
            cx="100"
            cy="18"
            rx="8"
            ry="3"
            fill="rgba(255,255,255,0.18)"
            style={{ animation: "wheelGlow 2s ease-in-out infinite" }}
          />
          <rect x="94" y="30" width="12" height="8" rx="2" fill="#3C2518" />
        </svg>
      </div>

      <p
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: "0.8rem",
          color: "var(--color-clay-ink-muted)",
          marginTop: 6,
          textAlign: "center",
          opacity: isDragging ? 0.4 : 0.85,
          transition: "opacity 0.15s",
        }}
      >
        {isDragging ? "shaping…" : "↕ height  ↔ band width"}
      </p>
    </div>
  );
}

// ── FaceStudio ────────────────────────────────────────────────────────────
// Two-tab face builder: "Build" (Mii-style part picker) and "Doodle" (freehand).

const FACE_PALETTE = [
  { id: "ink",    hex: "#2C1810", label: "Ink" },
  { id: "rust",   hex: "#B84C2A", label: "Rust" },
  { id: "sky",    hex: "#5B8EC4", label: "Sky" },
  { id: "blush",  hex: "#D4847A", label: "Blush" },
  { id: "sage",   hex: "#6B8F6A", label: "Sage" },
  { id: "honey",  hex: "#C9901A", label: "Honey" },
];

const PREVIEW_S = 2.0; // scale for chip SVG previews (cx=32,cy=32 in 64px viewBox)
const CHIP_SIZE = 52;

/** Small inline SVG chip that previews a single face part. */
function PartChip({
  part,
  category,
  isSelected,
  onClick,
}: {
  part: { id: string; label: string; render: (cx: number, cy: number, s: number, ink: string) => React.ReactNode };
  category: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${category}: ${part.label}`}
      aria-pressed={isSelected}
      title={part.label}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "4px 5px",
        borderRadius: 9,
        background: isSelected ? "rgba(184,92,42,0.13)" : "rgba(232,213,176,0.35)",
        border: isSelected ? "2px solid #2C1810" : "2px solid transparent",
        cursor: "pointer",
        transform: isSelected ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.1s ease, border-color 0.1s, background 0.1s",
        flexShrink: 0,
      }}
    >
      <svg
        width={CHIP_SIZE}
        height={CHIP_SIZE}
        viewBox="0 0 64 64"
        fill="none"
        style={{ display: "block" }}
      >
        <circle cx="32" cy="32" r="28" fill="rgba(245,240,232,0.9)" stroke="rgba(44,24,16,0.12)" strokeWidth="1" />
        {part.render(32, 32, PREVIEW_S, "#2C1810")}
      </svg>
      <span
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: "0.62rem",
          color: isSelected ? "#2C1810" : "var(--color-clay-ink-muted)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {part.label}
      </span>
    </button>
  );
}

/** Horizontal scrollable row of part chips with a label. */
function PartRow({
  label,
  parts,
  selectedIndex,
  onSelect,
}: {
  label: string;
  parts: { id: string; label: string; render: (cx: number, cy: number, s: number, ink: string) => React.ReactNode }[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: "0.75rem",
          color: "var(--color-clay-ink-muted)",
          paddingLeft: 2,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          gap: 5,
          overflowX: "auto",
          paddingBottom: 2,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {parts.map((part, i) => (
          <PartChip
            key={part.id}
            part={part}
            category={label}
            isSelected={i === selectedIndex}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}

/** Horizontal scrollable row for accessory (keyed by string id, not index). */
function AccessoryRow({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: "0.75rem",
          color: "var(--color-clay-ink-muted)",
          paddingLeft: 2,
        }}
      >
        Accessory
      </span>
      <div
        style={{
          display: "flex",
          gap: 5,
          overflowX: "auto",
          paddingBottom: 2,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {ACCESSORY_PARTS.map((part) => (
          <PartChip
            key={part.id}
            part={part}
            category="Accessory"
            isSelected={part.id === selectedId}
            onClick={() => onSelect(part.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FaceStudio({
  face,
  glaze,
  onFaceChange,
}: {
  face: FaceId | string;
  glaze: string;
  onFaceChange: (f: FaceId | string) => void;
}) {
  // Determine active tab from the current face type
  const defaultTab = typeof face === "string" && face.startsWith("draw:") ? "doodle" : "build";
  const [tab, setTab] = useState<"build" | "doodle">(defaultTab);
  const glazeHex = resolveGlaze(glaze);

  // Parse mii state from face prop (or fall back to defaults)
  const initMii: MiiFace = typeof face === "string" && face.startsWith("mii:")
    ? parseMiiFace(face)
    : { ...DEFAULT_MII_FACE };

  const [mii, setMii] = useState<MiiFace>(initMii);

  // Keep mii state in sync when face prop changes externally (e.g. surprise me)
  useEffect(() => {
    if (typeof face === "string" && face.startsWith("mii:")) {
      setMii(parseMiiFace(face));
    }
  }, [face]);

  function updateMii(update: Partial<MiiFace>) {
    const next = { ...mii, ...update };
    setMii(next);
    onFaceChange(encodeMiiFace(next));
  }

  function handleDrawChange(encoding: string) {
    onFaceChange(!encoding || encoding === "none" ? "none" : encoding);
  }

  const pillBase: React.CSSProperties = {
    fontFamily: "var(--font-hand)",
    fontSize: "0.82rem",
    padding: "5px 16px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  };
  const pillActive: React.CSSProperties = {
    background: "#B85C2A",
    color: "#F5F0E8",
  };
  const pillInactive: React.CSSProperties = {
    background: "rgba(232,213,176,0.5)",
    color: "var(--color-clay-ink-muted)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => {
            setTab("build");
            // If currently a draw face, switch to mii
            if (typeof face !== "string" || !face.startsWith("mii:")) {
              onFaceChange(encodeMiiFace(mii));
            }
          }}
          style={{ ...pillBase, ...(tab === "build" ? pillActive : pillInactive) }}
          aria-pressed={tab === "build"}
        >
          Build
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("doodle");
            // If currently a mii/preset face, don't wipe — just switch display
            if (typeof face === "string" && !face.startsWith("draw:")) {
              onFaceChange("none");
            }
          }}
          style={{ ...pillBase, ...(tab === "doodle" ? pillActive : pillInactive) }}
          aria-pressed={tab === "doodle"}
        >
          Doodle
        </button>
      </div>

      {/* Build tab */}
      {tab === "build" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <PartRow
            label="Eyes"
            parts={EYE_PARTS}
            selectedIndex={mii.eyes}
            onSelect={(i) => updateMii({ eyes: i })}
          />
          <PartRow
            label="Brows"
            parts={BROW_PARTS}
            selectedIndex={mii.brows}
            onSelect={(i) => updateMii({ brows: i })}
          />
          <PartRow
            label="Mouth"
            parts={MOUTH_PARTS}
            selectedIndex={mii.mouth}
            onSelect={(i) => updateMii({ mouth: i })}
          />
          <PartRow
            label="Cheeks"
            parts={CHEEK_PARTS}
            selectedIndex={mii.cheeks}
            onSelect={(i) => updateMii({ cheeks: i })}
          />
          <AccessoryRow selectedId={mii.accessory} onSelect={(id) => updateMii({ accessory: id })} />

          {/* Ink color row */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.75rem", color: "var(--color-clay-ink-muted)", paddingLeft: 2 }}>
              Ink Color
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {FACE_PALETTE.map((c) => {
                const isActive = mii.ink === c.hex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={isActive}
                    onClick={() => updateMii({ ink: c.hex })}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: c.hex,
                      border: isActive ? "2.5px solid #2C1810" : "1.5px solid rgba(44,24,16,0.22)",
                      transform: isActive ? "scale(1.2)" : "scale(1)",
                      cursor: "pointer",
                      boxShadow: isActive ? "0 0 0 2px rgba(44,24,16,0.14)" : "none",
                      transition: "transform 0.1s",
                      flexShrink: 0,
                    }}
                  />
                );
              })}
              {/* Custom ink color */}
              <label
                title="Custom ink color"
                style={{
                  position: "relative",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: `conic-gradient(#2C1810, #B84C2A, #5B8EC4, #D4847A, #6B8F6A, #C9901A, #2C1810)`,
                  border: FACE_PALETTE.every((c) => c.hex !== mii.ink) ? "2.5px solid #2C1810" : "1.5px solid rgba(44,24,16,0.3)",
                  cursor: "pointer",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <input
                  type="color"
                  value={mii.ink}
                  onChange={(e) => updateMii({ ink: e.target.value })}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", padding: 0, border: "none" }}
                  aria-label="Custom ink color"
                />
              </label>
            </div>
          </div>

          {/* No-face button */}
          <button
            type="button"
            onClick={() => onFaceChange("none")}
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "0.75rem",
              color: face === "none" ? "#B85C2A" : "rgba(92,61,46,0.6)",
              background: face === "none" ? "rgba(184,92,42,0.1)" : "transparent",
              border: face === "none" ? "1.5px dashed #B85C2A" : "1.5px dashed rgba(44,24,16,0.2)",
              borderRadius: 8,
              padding: "4px 12px",
              cursor: "pointer",
              alignSelf: "flex-start",
              marginTop: 2,
            }}
            aria-pressed={face === "none"}
          >
            ✕ no face
          </button>
        </div>
      )}

      {/* Doodle tab */}
      {tab === "doodle" && (
        <div
          style={{
            background: "rgba(232,213,176,0.25)",
            borderRadius: 12,
            padding: "12px 12px 8px",
            border: "1.5px dashed rgba(44,24,16,0.2)",
          }}
        >
          <FaceDrawPad
            onChange={handleDrawChange}
            glazeColor={glazeHex}
            initialStrokes={
              typeof face === "string" && face.startsWith("draw:")
                ? parseFaceDrawing(face)
                : []
            }
          />
        </div>
      )}
    </div>
  );
}

// ── FaceAdjust: manual size / shape / location sliders ─────────────────────

function FaceSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.78rem", color: "#5C3D2E" }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#B85C2A", cursor: "pointer" }}
      />
    </label>
  );
}

function FaceAdjust({
  faceT,
  onChange,
}: {
  faceT: FaceTransform;
  onChange: (t: FaceTransform) => void;
}) {
  const set = (patch: Partial<FaceTransform>) => onChange({ ...faceT, ...patch });
  const isDefault =
    faceT.s === 1 && faceT.x === 0 && faceT.y === 0 && faceT.a === 0;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        background: "rgba(232,213,176,0.3)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.85rem", color: "#2C1810" }}>
          fine-tune the face
        </span>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FACE_TRANSFORM)}
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "0.75rem",
              color: "#5C3D2E",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
            }}
          >
            ↺ reset
          </button>
        )}
      </div>
      <FaceSlider label="size" value={faceT.s} min={0.5} max={1.8} step={0.05} onChange={(v) => set({ s: v })} />
      <FaceSlider label="shape · tall ↔ wide" value={faceT.a} min={-0.35} max={0.35} step={0.01} onChange={(v) => set({ a: v })} />
      <FaceSlider label="move · left ↔ right" value={faceT.x} min={-12} max={12} step={0.5} onChange={(v) => set({ x: v })} />
      <FaceSlider label="move · up ↔ down" value={faceT.y} min={-14} max={14} step={0.5} onChange={(v) => set({ y: v })} />
    </div>
  );
}

// ── StickyMiniPreview ──────────────────────────────────────────────────────
// Compact live pot pill that sticks to the top of the viewport once the
// wheel scrolls away (narrow containers only — hidden at @3xl where the
// wheel column is sticky instead). Zero-height rail so it never shifts
// layout. Must stay `sticky` (not `fixed`): the builder root is a
// size container, which makes it the containing block for fixed children.
function StickyMiniPreview({
  visible,
  shape,
  glaze,
  pattern,
  onJump,
}: {
  visible: boolean;
  shape: string;
  glaze: string;
  pattern: string;
  onJump: () => void;
}) {
  return (
    <div className="sticky z-30 h-0 @3xl:hidden" style={{ top: 10 }}>
      <button
        type="button"
        onClick={onJump}
        aria-label="Show the pottery wheel"
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        style={{
          position: "absolute",
          left: "50%",
          transform: visible
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(-12px)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 14px 4px 8px",
          borderRadius: 999,
          border: "1.5px solid rgba(44,24,16,0.25)",
          background: "rgba(250,243,225,0.85)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow: "0 4px 14px rgba(44,24,16,0.18)",
          cursor: "pointer",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        <VaseAvatar shape={shape} glaze={glaze} pattern={pattern} size={52} />
        <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.78rem", color: "#5C3D2E" }}>
          ↑ your pot
        </span>
      </button>
    </div>
  );
}

// ── AvatarBuilder (main export) ───────────────────────────────────────────

export default function AvatarBuilder({
  defaultShape   = DEFAULT_AVATAR.shape,
  defaultGlaze   = DEFAULT_AVATAR.glaze,
  defaultPattern = DEFAULT_AVATAR.pattern,
  formMode = true,
}: AvatarBuilderProps) {
  // Mode: "throw" = wheel; "classic" = preset picker (via disclosure)
  const [mode, setMode] = useState<"throw" | "classic">("throw");

  // Thrown2 vase state
  const [thrown2H, setThrown2H] = useState<number>(DEFAULT_THROWN2_H);
  const [thrown2Widths, setThrown2Widths] = useState<number[]>(DEFAULT_THROWN2_WIDTHS.slice());
  const [face, setFace] = useState<FaceId | string>("happy");
  // edge dial: 0 = round (default) … 1 = fully angular
  const [edge, setEdge] = useState<number>(0);
  // Manual face size / shape / location adjustment.
  const [faceT, setFaceT] = useState<FaceTransform>(DEFAULT_FACE_TRANSFORM);

  // Shared state
  const [glaze,   setGlaze]   = useState<string>(defaultGlaze as string);
  const [pattern, setPattern] = useState<AvatarPattern>(defaultPattern);

  // Classic preset state
  const [classicShape, setClassicShape] = useState<string>(defaultShape as string);
  const [classicOpen, setClassicOpen] = useState(false);

  // Live sculpt during an active wheel drag: set height + widths together
  // WITHOUT changing the band count, so the drag stays fluid.
  function handleSculpt(newH: number, newWidths: number[]) {
    setThrown2H(newH);
    setThrown2Widths(newWidths);
  }

  // On drag release, settle the band count to the height's natural value.
  function handleSculptEnd() {
    const nb = bandsForHeight(thrown2H);
    setThrown2Widths((prev) => (prev.length === nb ? prev : resampleWidths(prev, nb)));
  }

  // The final shape string to emit
  const shapeValue = mode === "throw"
    ? encodeThrown2Shape(thrown2H, thrown2Widths, face as FaceId, edge, faceT)
    : classicShape;

  function handleSurprise() {
    const { h, widths, edge: newEdge, glaze: newGlaze, face: newFace } = randomThrown2Params();
    const newBands = bandsForHeight(h);
    setThrown2H(h);
    setThrown2Widths(widths.length === newBands ? widths : resampleWidths(widths, newBands));
    setEdge(newEdge);
    setGlaze(newGlaze);
    setFace(newFace);
    setFaceT(DEFAULT_FACE_TRANSFORM);
  }

  function handleReset() {
    setThrown2H(DEFAULT_THROWN2_H);
    setThrown2Widths(DEFAULT_THROWN2_WIDTHS.slice());
    setFace("happy");
    setEdge(0);
    setFaceT(DEFAULT_FACE_TRANSFORM);
  }

  function switchToClassic(id: string) {
    setClassicShape(id);
    setMode("classic");
  }

  function switchToThrow() {
    setMode("throw");
  }

  // Sticky mini-pot: show the pill only while the wheel block is off-screen.
  const wheelBlockRef = useRef<HTMLDivElement>(null);
  const [wheelOnScreen, setWheelOnScreen] = useState(true);
  useEffect(() => {
    const el = wheelBlockRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setWheelOnScreen(entry.isIntersecting),
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function jumpToWheel() {
    wheelBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="@container">
      <style>{WHEEL_STYLE}</style>

      {/* Hidden inputs for form submission */}
      {formMode && (
        <>
          <input type="hidden" name="avatarShape"   value={shapeValue} />
          <input type="hidden" name="avatarGlaze"   value={glaze} />
          <input type="hidden" name="avatarPattern" value={pattern} />
        </>
      )}

      <StickyMiniPreview
        visible={!wheelOnScreen}
        shape={shapeValue}
        glaze={glaze}
        pattern={pattern}
        onJump={jumpToWheel}
      />

      <div className="flex flex-col gap-5 @3xl:grid @3xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)] @3xl:items-start @3xl:gap-x-8">
      {/* ── Preview column: sticky at @3xl so the pot stays in view ──────── */}
      <div
        ref={wheelBlockRef}
        className="flex flex-col gap-5 @3xl:sticky @3xl:top-6 @3xl:self-start"
        style={{ scrollMarginTop: 12 }}
      >
      {/* ── Pottery Wheel (throw mode) ─────────────────────────────────── */}
      {mode === "throw" && (
        <div className="flex flex-col items-center gap-3">
          <WheelVasePreview
            h={thrown2H}
            widths={thrown2Widths}
            glaze={glaze}
            pattern={pattern}
            face={face}
            edge={edge}
            faceT={faceT}
            onSculpt={handleSculpt}
            onSculptEnd={handleSculptEnd}
          />

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={handleSurprise}
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "0.85rem",
                color: "#2C1810",
                background: "rgba(212,168,64,0.18)",
                border: "1.5px solid rgba(44,24,16,0.3)",
                borderRadius: 8,
                padding: "4px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <DoodleIcon name="sparkle" size={14} color="#2C1810" /> surprise me
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "0.85rem",
                color: "#5C3D2E",
                background: "rgba(232,213,176,0.4)",
                border: "1.5px solid rgba(44,24,16,0.2)",
                borderRadius: 8,
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              ↺ start over
            </button>
          </div>
        </div>
      )}

      {/* ── Classic picker ────────────────────────────────────────────────── */}
      {mode === "classic" && (
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "12px 20px",
              background: "rgba(232,213,176,0.3)",
              borderRadius: 16,
            }}
          >
            <VaseAvatar shape={classicShape} glaze={glaze} pattern={pattern} size={100} />
            <span
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "0.85rem",
                color: "var(--color-clay-ink-muted)",
              }}
            >
              {AVATAR_SHAPES.find((s) => s.id === classicShape)?.label ?? "Classic"}
            </span>
          </div>
          <button
            type="button"
            onClick={switchToThrow}
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "0.85rem",
              color: "#B85C2A",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
            }}
          >
            ← back to wheel
          </button>
        </div>
      )}
      </div>

      {/* ── Controls column ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 min-w-0">
      {/* ── Face studio (throw mode only) ────────────────────────────────── */}
      {mode === "throw" && (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4
              className="text-sm"
              style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
            >
              Face
            </h4>
            {/* Edge dial — round ◠ … angular ◇ — kept from original ClayDate UI */}
            <label
              className="flex items-center gap-2"
              style={{ fontFamily: "var(--font-hand)", fontSize: "0.78rem", color: "#5C3D2E" }}
            >
              <span aria-hidden="true">◠</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={edge}
                onChange={(e) => setEdge(parseFloat(e.target.value))}
                aria-label="Edge style: rounded to angular"
                style={{ accentColor: "#B85C2A", width: 92, cursor: "pointer" }}
              />
              <span aria-hidden="true">◇</span>
            </label>
          </div>
          <FaceStudio
            face={face}
            glaze={glaze}
            onFaceChange={setFace}
          />
          {face !== "none" && (
            <FaceAdjust faceT={faceT} onChange={setFaceT} />
          )}
        </section>
      )}

      {/* ── Glaze picker ─────────────────────────────────────────────────── */}
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
                transition: "transform 0.1s ease, box-shadow 0.1s ease",
              }}
              aria-label={g.label}
              aria-pressed={glaze === g.id}
            />
          ))}
        </div>
      </section>

      {/* ── Pattern picker ───────────────────────────────────────────────── */}
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
                transition: "transform 0.1s ease",
              }}
              aria-pressed={pattern === p.id}
            >
              <VaseAvatar
                shape={mode === "throw" ? encodeThrown2Shape(thrown2H, thrown2Widths, face as FaceId, edge) : classicShape}
                glaze={glaze}
                pattern={p.id}
                size={32}
              />
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

      {/* ── Classic shapes disclosure ─────────────────────────────────────── */}
      <section>
        <button
          type="button"
          onClick={() => setClassicOpen((v) => !v)}
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "0.85rem",
            color: "#5C3D2E",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 0,
            opacity: 0.75,
          }}
          aria-expanded={classicOpen}
        >
          <span
            style={{
              display: "inline-block",
              transform: classicOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
              fontSize: "0.8rem",
            }}
          >
            ▶
          </span>
          classic shapes (no wheel needed)
        </button>

        {classicOpen && (
          <div className="flex flex-wrap gap-2 mt-3">
            {AVATAR_SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => switchToClassic(s.id)}
                aria-label={s.label}
                className="relative flex flex-col items-center gap-1 p-2 rounded-lg"
                style={{
                  background:
                    mode === "classic" && classicShape === s.id
                      ? "rgba(184,92,42,0.12)"
                      : "rgba(232,213,176,0.3)",
                  border:
                    mode === "classic" && classicShape === s.id
                      ? "2px solid #2C1810"
                      : "2px solid transparent",
                  transform:
                    mode === "classic" && classicShape === s.id
                      ? "scale(1.08)"
                      : "scale(1)",
                  cursor: "pointer",
                  transition: "transform 0.1s ease",
                }}
              >
                <VaseAvatar shape={s.id} glaze={glaze} pattern={pattern} size={40} />
                <span
                  className="text-xs leading-none"
                  style={{
                    fontFamily: "var(--font-hand)",
                    color: "var(--color-clay-ink-muted)",
                  }}
                >
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      </div>
      </div>
    </div>
  );
}
