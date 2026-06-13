import { useId } from "react";
import {
  getShape,
  getGlaze,
  getPattern,
  parseShape,
  buildThrownPath,
  buildThrown2Path,
  thrown2LipY,
  THROWN2_FOOT_Y,
} from "@/lib/avatars";
import type { AvatarShape, AvatarGlaze, AvatarPattern, FaceId, ThrownParams } from "@/lib/avatars";

interface VaseAvatarProps {
  shape?: AvatarShape | string;
  glaze?: AvatarGlaze | string;
  pattern?: AvatarPattern | string;
  size?: number;
  className?: string;
}

/** Darken a hex color by mixing with ink */
function darkenFill(hex: string, amount = 0.3): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const ink = [0x18, 0x10, 0x0C];
  const nr = Math.round(r + (ink[0] - r) * amount);
  const ng = Math.round(g + (ink[1] - g) * amount);
  const nb = Math.round(b + (ink[2] - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

/** Lighten a hex color by mixing with warm white */
function lightenFill(hex: string, amount = 0.4): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const cream = [0xF8, 0xF2, 0xE8];
  const nr = Math.round(r + (cream[0] - r) * amount);
  const ng = Math.round(g + (cream[1] - g) * amount);
  const nb = Math.round(b + (cream[2] - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

/** Parse hex to [r, g, b] 0-255, returns null on failure */
function hexToRgb(hex: string): [number, number, number] | null {
  if (!hex.startsWith("#") || hex.length < 7) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

/** Compute relative lightness (perceptual) 0-1 */
function getLightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb;
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  return (max + min) / 2;
}

/**
 * Render a face onto the vase at the given position.
 * cx/cy = center of face area; scale = size factor.
 */
function FaceOverlay({
  face,
  cx,
  cy,
  scale,
}: {
  face: FaceId;
  cx: number;
  cy: number;
  scale: number;
}) {
  if (face === "none") return null;

  const ink = "#2C1810";
  const blushColor = "rgba(212,132,122,0.55)";
  const s = scale; // shorthand

  switch (face) {
    case "happy":
      return (
        <g>
          {/* Eyes: two filled dots */}
          <circle cx={cx - 3.5 * s} cy={cy - 1 * s} r={1.1 * s} fill={ink} />
          <circle cx={cx + 3.5 * s} cy={cy - 1 * s} r={1.1 * s} fill={ink} />
          {/* Smile: small arc */}
          <path
            d={`M ${cx - 3 * s} ${cy + 2.5 * s} Q ${cx} ${cy + 5.5 * s} ${cx + 3 * s} ${cy + 2.5 * s}`}
            stroke={ink}
            strokeWidth={1.1 * s}
            fill="none"
            strokeLinecap="round"
          />
          {/* Blush circles */}
          <ellipse cx={cx - 5 * s} cy={cy + 2 * s} rx={2.2 * s} ry={1.4 * s} fill={blushColor} />
          <ellipse cx={cx + 5 * s} cy={cy + 2 * s} rx={2.2 * s} ry={1.4 * s} fill={blushColor} />
        </g>
      );

    case "sleepy":
      return (
        <g>
          {/* Half-closed eyes: arcs */}
          <path
            d={`M ${cx - 5 * s} ${cy - 0.5 * s} Q ${cx - 3.5 * s} ${cy - 2.5 * s} ${cx - 2 * s} ${cy - 0.5 * s}`}
            stroke={ink}
            strokeWidth={1.1 * s}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx + 2 * s} ${cy - 0.5 * s} Q ${cx + 3.5 * s} ${cy - 2.5 * s} ${cx + 5 * s} ${cy - 0.5 * s}`}
            stroke={ink}
            strokeWidth={1.1 * s}
            fill="none"
            strokeLinecap="round"
          />
          {/* Zzz dots */}
          <circle cx={cx + 5.8 * s} cy={cy - 3 * s} r={0.7 * s} fill={ink} fillOpacity="0.6" />
          <circle cx={cx + 7.2 * s} cy={cy - 4.5 * s} r={0.5 * s} fill={ink} fillOpacity="0.4" />
          {/* Gentle smile */}
          <path
            d={`M ${cx - 2.5 * s} ${cy + 3 * s} Q ${cx} ${cy + 5 * s} ${cx + 2.5 * s} ${cy + 3 * s}`}
            stroke={ink}
            strokeWidth={1 * s}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );

    case "winky":
      return (
        <g>
          {/* Left eye: filled dot */}
          <circle cx={cx - 3.5 * s} cy={cy - 1 * s} r={1.1 * s} fill={ink} />
          {/* Right eye: wink arc */}
          <path
            d={`M ${cx + 2 * s} ${cy - 1 * s} Q ${cx + 3.5 * s} ${cy - 3 * s} ${cx + 5 * s} ${cy - 1 * s}`}
            stroke={ink}
            strokeWidth={1.1 * s}
            fill="none"
            strokeLinecap="round"
          />
          {/* Wide grin */}
          <path
            d={`M ${cx - 3.5 * s} ${cy + 2 * s} Q ${cx} ${cy + 6 * s} ${cx + 3.5 * s} ${cy + 2 * s}`}
            stroke={ink}
            strokeWidth={1.1 * s}
            fill="none"
            strokeLinecap="round"
          />
          {/* One blush */}
          <ellipse cx={cx + 5.5 * s} cy={cy + 2.5 * s} rx={2 * s} ry={1.3 * s} fill={blushColor} />
        </g>
      );

    case "surprised":
      return (
        <g>
          {/* Wide round eyes */}
          <circle cx={cx - 3.5 * s} cy={cy - 1.5 * s} r={1.7 * s} fill={ink} />
          <circle cx={cx + 3.5 * s} cy={cy - 1.5 * s} r={1.7 * s} fill={ink} />
          {/* Tiny white shine dots */}
          <circle cx={cx - 4 * s} cy={cy - 2 * s} r={0.6 * s} fill="white" />
          <circle cx={cx + 3 * s} cy={cy - 2 * s} r={0.6 * s} fill="white" />
          {/* Open-O mouth */}
          <ellipse cx={cx} cy={cy + 3.5 * s} rx={2 * s} ry={2.5 * s} fill={ink} />
          <ellipse cx={cx} cy={cy + 3.5 * s} rx={1.2 * s} ry={1.7 * s} fill={lightenFill("#B85C2A", 0.6)} />
        </g>
      );

    default:
      return null;
  }
}

/** Compute face center position relative to the vase shape */
function getFacePosition(
  kind: "preset" | "thrown" | "thrown2",
  path: string,
  thrownParams?: ThrownParams,
  thrown2?: { h: number; widths: number[] }
): { cx: number; cy: number; scale: number } {
  if (kind === "thrown" && thrownParams) {
    const { h, b } = thrownParams;
    // topY = 4 + (1 - h) * 14
    const topY = 4 + (1 - h) * 14;
    const bottomY = 60;
    // Face at ~55% of height (upper body / chest area)
    const faceY = topY + (bottomY - topY) * 0.52;
    // Scale based on belly width
    const scale = 0.55 + b * 0.35;
    return { cx: 32, cy: faceY, scale };
  }
  if (kind === "thrown2" && thrown2) {
    const { h, widths } = thrown2;
    // Use the actual lip/foot ys from the path builder helpers
    const lipY = thrown2LipY(h);    // h=0 → 34, h=1 → 6
    const footY = THROWN2_FOOT_Y;  // 58
    // Place face near the widest band in the upper portion
    const N = widths.length;
    const upperThirdEnd = Math.ceil(N * 0.67);
    let maxW = -1;
    let maxIdx = Math.floor(N * 0.5);
    for (let i = 1; i < upperThirdEnd; i++) {
      if (widths[i] > maxW) { maxW = widths[i]; maxIdx = i; }
    }
    const t = maxIdx / (N - 1);
    // bandY at maxIdx: footY - t*(footY-lipY)
    const faceY = footY - t * (footY - lipY);
    const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
    const scale = 0.5 + avgWidth * 0.4;
    return { cx: 32, cy: faceY, scale };
  }
  // For preset shapes: center vertically around 57% of viewBox height, centered X
  return { cx: 32, cy: 36, scale: 0.9 };
}

export default function VaseAvatar({
  shape: shapeProp,
  glaze: glazeProp,
  pattern: patternProp,
  size = 32,
  className,
}: VaseAvatarProps) {
  // Parse shape
  const parsed = parseShape(shapeProp ?? "round-belly");
  const isThrownShape = parsed.kind === "thrown";
  const isThrown2Shape = parsed.kind === "thrown2";

  // Resolve the SVG path
  const vasePath = isThrownShape
    ? buildThrownPath(parsed.params)
    : isThrown2Shape
      ? buildThrown2Path(parsed.h, parsed.widths, parsed.edge)
      : getShape(parsed.id).path;

  const glazeData  = getGlaze(glazeProp  ?? "terracotta");
  const patternId  = (patternProp ?? "plain") as AvatarPattern;

  // Face only exists on thrown vases
  const face: FaceId = (isThrownShape || isThrown2Shape) ? parsed.face : "none";

  // useId guarantees document-unique, SSR/hydration-stable ids even when the
  // same shape/glaze/pattern combo renders multiple times on one page.
  // Strip the delimiter chars (e.g. «r1» / :r1:) — they break url(#...) refs.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId  = `clip-${uid}`;
  const patId   = `pat-${uid}`;
  const glazeId = `glaze-${uid}`;
  const specId  = `spec-${uid}`;
  const rimId   = `rim-${uid}`;

  const fill = glazeData.fill;
  const ink  = "#2C1810";

  // ── Realistic glaze color derivation ────────────────────────────────────
  // Determine lightness to adapt the gradient stops
  const lightness = getLightness(fill);
  const isDark = lightness < 0.35;
  const isVeryLight = lightness > 0.7;

  // Base color stops
  // Rim highlight: lighter, slightly bluer (fired glaze brightens at rim)
  const rimLight   = lightenFill(fill, isDark ? 0.45 : 0.32);
  // Mid: the true glaze color, slightly saturated
  const midFill    = fill;
  // Pool: glaze drips/pools darker and deeper at the base
  const poolDark   = darkenFill(fill, isDark ? 0.18 : 0.30);
  // Specular blob: off-center bright spot where kiln light caught the wet glaze
  const specHigh   = lightenFill(fill, isVeryLight ? 0.55 : isDark ? 0.70 : 0.65);

  const patternFill = darkenFill(fill, 0.28);
  const patternFillLight = lightenFill(fill, 0.35);

  // Render pattern defs
  function renderPatternDef() {
    switch (patternId) {
      case "stripes":
        return (
          <pattern id={patId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={patternFill} strokeWidth="3" strokeOpacity="0.5" />
          </pattern>
        );
      case "dots":
        return (
          <pattern id={patId} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.8" fill={patternFill} fillOpacity="0.55" />
          </pattern>
        );
      case "squiggle":
        return (
          <pattern id={patId} width="14" height="12" patternUnits="userSpaceOnUse">
            <path
              d="M 0 6 C 2 3 4 3 7 6 C 10 9 12 9 14 6"
              stroke={patternFill}
              strokeWidth="1.4"
              strokeOpacity="0.55"
              fill="none"
              strokeLinecap="round"
            />
          </pattern>
        );
      case "flowers":
        return (
          <pattern id={patId} width="14" height="14" patternUnits="userSpaceOnUse">
            <g transform="translate(7,7)">
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <ellipse
                  key={deg}
                  cx={0}
                  cy={-3}
                  rx={1.2}
                  ry={2.4}
                  fill={patternFill}
                  fillOpacity="0.5"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle cx={0} cy={0} r={1.2} fill={patternFillLight} fillOpacity="0.8" />
            </g>
          </pattern>
        );
      default:
        return null;
    }
  }

  // Face position
  const { cx: faceCx, cy: faceCy, scale: faceScale } = getFacePosition(
    parsed.kind,
    vasePath,
    isThrownShape ? parsed.params : undefined,
    isThrown2Shape ? { h: parsed.h, widths: parsed.widths } : undefined
  );

  // Scale the face rendering (faces are designed at scale=1 for ~64px, so adjust)
  const faceSizeScale = (size / 64) * faceScale;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={vasePath} />
        </clipPath>
        {renderPatternDef()}

        {/* ── Realistic glaze: vertical linear gradient (pools at base) ── */}
        {/* Lighter at rim (top), true color mid-body, darker pooled at base */}
        <linearGradient
          id={glazeId}
          x1="0" y1="0" x2="0" y2="1"
          gradientUnits="objectBoundingBox"
        >
          {/* Rim brightness — fired glaze becomes bright/saturated at opening */}
          <stop offset="0%"   stopColor={rimLight} stopOpacity="1" />
          {/* Upper body — close to true glaze color */}
          <stop offset="25%"  stopColor={lightenFill(midFill, 0.10)} stopOpacity="1" />
          {/* Mid body — base hue */}
          <stop offset="55%"  stopColor={midFill}   stopOpacity="1" />
          {/* Lower body — glaze thickens / deepens as it flows down */}
          <stop offset="80%"  stopColor={darkenFill(fill, isDark ? 0.12 : 0.20)} stopOpacity="1" />
          {/* Foot pool — glaze collects and darkens at the base */}
          <stop offset="100%" stopColor={poolDark} stopOpacity="1" />
        </linearGradient>

        {/* ── Specular highlight: off-center radial blob (kiln gloss) ── */}
        <radialGradient
          id={specId}
          cx="36%"
          cy="22%"
          r="38%"
          fx="32%"
          fy="17%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%"   stopColor={specHigh}  stopOpacity="0.75" />
          <stop offset="45%"  stopColor={specHigh}  stopOpacity="0.20" />
          <stop offset="100%" stopColor={specHigh}  stopOpacity="0" />
        </radialGradient>

        {/* ── Rim darkening: thin linear band at top to simulate clay rim shadow ── */}
        <linearGradient
          id={rimId}
          x1="0" y1="0" x2="0" y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%"   stopColor={ink} stopOpacity="0.13" />
          <stop offset="7%"   stopColor={ink} stopOpacity="0.05" />
          <stop offset="15%"  stopColor={ink} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Vase: base flat fill (ensures solid fallback + pixel-rounding safety) ── */}
      <path
        d={vasePath}
        fill={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Vertical gradient glaze (depth: pools at base, bright at rim) ── */}
      <path
        d={vasePath}
        fill={`url(#${glazeId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Specular highlight blob (off-center, upper-left) ── */}
      <path
        d={vasePath}
        fill={`url(#${specId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Rim shadow (slight darkening at top lip) ── */}
      <path
        d={vasePath}
        fill={`url(#${rimId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Pattern overlay (clipped to vase) ── */}
      {patternId !== "plain" && (
        <rect
          x="0"
          y="0"
          width="64"
          height="64"
          fill={`url(#${patId})`}
          clipPath={`url(#${clipId})`}
        />
      )}

      {/* ── Face overlay (only for thrown vases with a face) ── */}
      {face !== "none" && (
        <FaceOverlay
          face={face}
          cx={faceCx}
          cy={faceCy}
          scale={faceSizeScale}
        />
      )}

      {/* ── Ink outline – hand-drawn feel ── */}
      <path
        d={vasePath}
        fill="none"
        stroke={ink}
        strokeWidth={size < 40 ? 1.8 : 2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Glaze streak highlight (running along the upper left edge) ── */}
      <path
        d={vasePath}
        fill="none"
        stroke={specHigh}
        strokeWidth={size < 40 ? 1 : 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 28"
        strokeDashoffset="6"
        opacity="0.55"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
