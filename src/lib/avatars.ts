// ── Avatar System ─────────────────────────────────────────────────────────
// This file is the canonical contract for all avatar data.
// Other phases import from here; do not rename exports.

// AvatarShape is widened to accept both preset IDs and thrown encodings
export type PresetShapeId =
  | "round-belly"
  | "tall-slim"
  | "amphora"
  | "squat-wide"
  | "gourd"
  | "flared-rim";

// Widen AvatarShape to accept thrown encodings (string & {}) while keeping
// preset IDs autocomplete-friendly. tsc-strict-safe.
export type AvatarShape = PresetShapeId | (string & Record<never, never>);

export type AvatarGlaze =
  | "terracotta"
  | "celadon"
  | "cobalt"
  | "ivory"
  | "sage-matte"
  | "blush-gloss"
  | "midnight"
  | "honey";

export type AvatarPattern =
  | "plain"
  | "stripes"
  | "dots"
  | "squiggle"
  | "flowers";

export interface Avatar {
  shape: AvatarShape;
  glaze: AvatarGlaze;
  pattern: AvatarPattern;
}

// ── Shapes (64×64 viewBox, hand-drawn feeling silhouettes) ────────────────

export interface AvatarShapeData {
  id: PresetShapeId;
  label: string;
  /** SVG path in 0 0 64 64 viewBox */
  path: string;
}

export const AVATAR_SHAPES: AvatarShapeData[] = [
  {
    id: "round-belly",
    label: "Round Belly",
    // Classic round-bellied pot: narrow neck, wide belly, small foot
    path: "M 26 8 C 24 8 22 10 21.5 12 C 21 14 21.5 17 22 19 C 16 21 11 27 10 34 C 9 41 11 50 16 54 C 19 56 23 57 32 57 C 41 57 45 56 48 54 C 53 50 55 41 54 34 C 53 27 48 21 42 19 C 42.5 17 43 14 42.5 12 C 42 10 40 8 38 8 Z",
  },
  {
    id: "tall-slim",
    label: "Tall & Slim",
    // Elegant tall vase with graceful taper
    path: "M 27 6 C 25 6 23 8 22 10 C 21 12 21 15 22 18 C 18 21 16 26 15 33 C 14 40 15 50 18 54 C 20 56 24 58 32 58 C 40 58 44 56 46 54 C 49 50 50 40 49 33 C 48 26 46 21 42 18 C 43 15 43 12 42 10 C 41 8 39 6 37 6 Z",
  },
  {
    id: "amphora",
    label: "Amphora",
    // Amphora with side handles
    path: "M 25 6 C 23 6 22 8 22 10 L 22 16 C 18 17 12 20 10 26 L 8 30 C 7 32 8 34 10 34 L 14 34 C 14 41 16 50 19 54 C 22 57 26 58 32 58 C 38 58 42 57 45 54 C 48 50 50 41 50 34 L 54 34 C 56 34 57 32 56 30 L 54 26 C 52 20 46 17 42 16 L 42 10 C 42 8 41 6 39 6 Z",
  },
  {
    id: "squat-wide",
    label: "Squat Wide",
    // Wide low bowl-vase, very round and friendly
    path: "M 23 14 C 21 14 19 16 18 18 C 17 20 17 22 18 24 C 12 27 8 33 8 40 C 8 47 12 53 18 56 C 22 58 27 59 32 59 C 37 59 42 58 46 56 C 52 53 56 47 56 40 C 56 33 52 27 46 24 C 47 22 47 20 46 18 C 45 16 43 14 41 14 Z",
  },
  {
    id: "gourd",
    label: "Gourd",
    // Double-bulge gourd shape
    path: "M 28 5 C 26 5 24 7 24 9 C 24 12 25 14 26 16 C 22 18 19 22 19 27 C 19 32 22 35 25 37 C 20 40 16 45 16 51 C 16 56 20 60 32 60 C 44 60 48 56 48 51 C 48 45 44 40 39 37 C 42 35 45 32 45 27 C 45 22 42 18 38 16 C 39 14 40 12 40 9 C 40 7 38 5 36 5 Z",
  },
  {
    id: "flared-rim",
    label: "Flared Rim",
    // Vase with dramatically flared opening
    path: "M 16 8 C 14 8 14 10 15 11 C 17 13 22 14 24 15 C 22 17 21 20 21 23 C 20 27 20 32 20 37 C 18 40 14 44 14 50 C 14 55 19 58 32 58 C 45 58 50 55 50 50 C 50 44 46 40 44 37 C 44 32 44 27 43 23 C 43 20 42 17 40 15 C 42 14 47 13 49 11 C 50 10 50 8 48 8 C 44 8 37 10 32 10 C 27 10 20 8 16 8 Z",
  },
];

// ── Glazes ────────────────────────────────────────────────────────────────

export interface AvatarGlazeData {
  id: AvatarGlaze;
  label: string;
  fill: string;
}

export const AVATAR_GLAZES: AvatarGlazeData[] = [
  { id: "terracotta", label: "Terracotta",  fill: "#B85C2A" },
  { id: "celadon",    label: "Celadon",     fill: "#A8C5A0" },
  { id: "cobalt",     label: "Cobalt Blue", fill: "#4A7BAF" },
  { id: "ivory",      label: "Ivory",       fill: "#F0E6D0" },
  { id: "sage-matte", label: "Sage Matte",  fill: "#7A8C6E" },
  { id: "blush-gloss",label: "Blush Gloss", fill: "#D4847A" },
  { id: "midnight",   label: "Midnight",    fill: "#2C3E50" },
  { id: "honey",      label: "Honey",       fill: "#D4A840" },
];

// ── Patterns ──────────────────────────────────────────────────────────────

export interface AvatarPatternData {
  id: AvatarPattern;
  label: string;
}

export const AVATAR_PATTERNS: AvatarPatternData[] = [
  { id: "plain",    label: "Plain" },
  { id: "stripes",  label: "Stripes" },
  { id: "dots",     label: "Dots" },
  { id: "squiggle", label: "Squiggle" },
  { id: "flowers",  label: "Flowers" },
];

// ── Faces ─────────────────────────────────────────────────────────────────

export type FaceId = "none" | "happy" | "sleepy" | "winky" | "surprised";

export interface AvatarFaceData {
  id: FaceId;
  label: string;
}

export const AVATAR_FACES: AvatarFaceData[] = [
  { id: "none",      label: "No face" },
  { id: "happy",     label: "Happy" },
  { id: "sleepy",    label: "Sleepy" },
  { id: "winky",     label: "Winky" },
  { id: "surprised", label: "Surprised" },
];

// ── Thrown vase parameters ────────────────────────────────────────────────

export interface ThrownParams {
  /** Height factor 0..1 (tall ↔ squat) */
  h: number;
  /** Belly width factor 0..1 */
  b: number;
  /** Neck width factor 0..1 */
  n: number;
  /** Lip flare factor 0..1 */
  l: number;
  /** Foot width factor 0..1 */
  f: number;
}

// ── Encoding & parsing ────────────────────────────────────────────────────

const VALID_FACE_IDS = new Set<FaceId>(["none", "happy", "sleepy", "winky", "surprised"]);
const PRESET_IDS = new Set<string>(AVATAR_SHAPES.map((s) => s.id));

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Encode thrown vase params into a storable shape string. */
export function encodeThrownShape(params: ThrownParams, face: FaceId): string {
  const h = clamp01(params.h).toFixed(3);
  const b = clamp01(params.b).toFixed(3);
  const n = clamp01(params.n).toFixed(3);
  const l = clamp01(params.l).toFixed(3);
  const f = clamp01(params.f).toFixed(3);
  const faceId: FaceId = VALID_FACE_IDS.has(face) ? face : "none";
  return `thrown:h=${h},b=${b},n=${n},l=${l},f=${f};face=${faceId}`;
}

export type ParsedShape =
  | { kind: "preset"; id: PresetShapeId }
  | { kind: "thrown"; params: ThrownParams; face: FaceId };

/** Parse an avatar_shape string to either a preset or thrown shape. */
export function parseShape(shape: string): ParsedShape {
  // Empty or missing → default preset
  if (!shape) {
    return { kind: "preset", id: DEFAULT_AVATAR.shape as PresetShapeId };
  }

  // Preset ID
  if (PRESET_IDS.has(shape)) {
    return { kind: "preset", id: shape as PresetShapeId };
  }

  // Thrown encoding: thrown:h=0.82,b=0.71,n=0.38,l=0.25,f=0.45;face=happy
  if (shape.startsWith("thrown:")) {
    try {
      const rest = shape.slice("thrown:".length);
      const [paramsPart, facePart] = rest.split(";");

      if (!paramsPart || !facePart) {
        return { kind: "preset", id: DEFAULT_AVATAR.shape as PresetShapeId };
      }

      // Parse params
      const paramMap: Record<string, number> = {};
      for (const kv of paramsPart.split(",")) {
        const [k, v] = kv.split("=");
        const num = parseFloat(v);
        if (!k || isNaN(num)) {
          return { kind: "preset", id: DEFAULT_AVATAR.shape as PresetShapeId };
        }
        paramMap[k.trim()] = clamp01(num);
      }

      const h = paramMap["h"];
      const b = paramMap["b"];
      const n = paramMap["n"];
      const l = paramMap["l"];
      const f = paramMap["f"];

      if (
        h === undefined ||
        b === undefined ||
        n === undefined ||
        l === undefined ||
        f === undefined
      ) {
        return { kind: "preset", id: DEFAULT_AVATAR.shape as PresetShapeId };
      }

      // Parse face
      const faceMatch = facePart.match(/^face=(.+)$/);
      const rawFace = faceMatch ? faceMatch[1].trim() : "none";
      const face: FaceId = VALID_FACE_IDS.has(rawFace as FaceId)
        ? (rawFace as FaceId)
        : "none";

      return {
        kind: "thrown",
        params: { h, b, n, l, f },
        face,
      };
    } catch {
      return { kind: "preset", id: DEFAULT_AVATAR.shape as PresetShapeId };
    }
  }

  // Unrecognized → default preset
  return { kind: "preset", id: DEFAULT_AVATAR.shape as PresetShapeId };
}

/** Re-encode a parsed thrown shape canonically (clamped). Used in auth.ts. */
export function canonicalizeShape(shape: string): string {
  const parsed = parseShape(shape);
  if (parsed.kind === "preset") {
    return parsed.id;
  }
  return encodeThrownShape(parsed.params, parsed.face);
}

// ── buildThrownPath ───────────────────────────────────────────────────────
// Generates a smooth symmetric SVG path from the 5 params.
// 64×64 viewBox; center = x=32.
// Profile: foot → belly → neck → lip, mirrored, closed.

export function buildThrownPath(params: ThrownParams): string {
  const { h, b, n, l, f } = {
    h: clamp01(params.h),
    b: clamp01(params.b),
    n: clamp01(params.n),
    l: clamp01(params.l),
    f: clamp01(params.f),
  };

  // Map params to pixel dimensions in 64×64 viewBox
  // Vertical: top of vase ↔ bottom
  const topY    = 4 + (1 - h) * 14;      // taller h → lower topY (more height)
  const bottomY = 60;                      // foot always near bottom

  // Horizontal half-widths (symmetric around x=32)
  const footHW  = 4  + f * 10;            // 4..14
  const bellyHW = 10 + b * 18;            // 10..28
  const neckHW  = 3  + n * 9;             // 3..12
  const lipHW   = neckHW + l * 8;         // neckHW..neckHW+8

  // Key Y positions
  const lipY    = topY;
  const neckY   = topY + (bottomY - topY) * 0.18;
  const bellyY  = topY + (bottomY - topY) * 0.55;
  const footY   = bottomY;

  // Right profile points
  const rLip    = 32 + lipHW;
  const rNeck   = 32 + neckHW;
  const rBelly  = 32 + bellyHW;
  const rFoot   = 32 + footHW;

  // Left profile points
  const lLip    = 32 - lipHW;
  const lNeck   = 32 - neckHW;
  const lBelly  = 32 - bellyHW;
  const lFoot   = 32 - footHW;

  // Bezier control points for right side (bottom to top)
  // Foot → belly: curve out
  const r_fToB_cp1x = rFoot;
  const r_fToB_cp1y = footY - (footY - bellyY) * 0.3;
  const r_fToB_cp2x = rBelly;
  const r_fToB_cp2y = bellyY + (footY - bellyY) * 0.3;

  // Belly → neck: curve in
  const r_bToN_cp1x = rBelly;
  const r_bToN_cp1y = bellyY - (bellyY - neckY) * 0.35;
  const r_bToN_cp2x = rNeck;
  const r_bToN_cp2y = neckY + (bellyY - neckY) * 0.35;

  // Neck → lip: gentle flare or taper
  const r_nToL_cp1x = rNeck;
  const r_nToL_cp1y = neckY - (neckY - lipY) * 0.4;
  const r_nToL_cp2x = rLip;
  const r_nToL_cp2y = lipY + (neckY - lipY) * 0.4;

  // Bezier control points for left side (top to bottom, mirrored)
  const l_nToL_cp1x = lLip;
  const l_nToL_cp1y = lipY + (neckY - lipY) * 0.4;
  const l_nToL_cp2x = lNeck;
  const l_nToL_cp2y = neckY - (neckY - lipY) * 0.4;

  const l_bToN_cp1x = lNeck;
  const l_bToN_cp1y = neckY + (bellyY - neckY) * 0.35;
  const l_bToN_cp2x = lBelly;
  const l_bToN_cp2y = bellyY - (bellyY - neckY) * 0.35;

  const l_fToB_cp1x = lBelly;
  const l_fToB_cp1y = bellyY + (footY - bellyY) * 0.3;
  const l_fToB_cp2x = lFoot;
  const l_fToB_cp2y = footY - (footY - bellyY) * 0.3;

  const p = (n: number) => n.toFixed(2);

  // Start at right foot, go up right side, across lip, down left side, close at foot
  return [
    `M ${p(rFoot)} ${p(footY)}`,
    // Right side: foot → belly
    `C ${p(r_fToB_cp1x)} ${p(r_fToB_cp1y)}, ${p(r_fToB_cp2x)} ${p(r_fToB_cp2y)}, ${p(rBelly)} ${p(bellyY)}`,
    // Right side: belly → neck
    `C ${p(r_bToN_cp1x)} ${p(r_bToN_cp1y)}, ${p(r_bToN_cp2x)} ${p(r_bToN_cp2y)}, ${p(rNeck)} ${p(neckY)}`,
    // Right side: neck → lip
    `C ${p(r_nToL_cp1x)} ${p(r_nToL_cp1y)}, ${p(r_nToL_cp2x)} ${p(r_nToL_cp2y)}, ${p(rLip)} ${p(lipY)}`,
    // Lip across top (slight arc)
    `Q 32 ${p(lipY - 2)}, ${p(lLip)} ${p(lipY)}`,
    // Left side: lip → neck
    `C ${p(l_nToL_cp1x)} ${p(l_nToL_cp1y)}, ${p(l_nToL_cp2x)} ${p(l_nToL_cp2y)}, ${p(lNeck)} ${p(neckY)}`,
    // Left side: neck → belly
    `C ${p(l_bToN_cp1x)} ${p(l_bToN_cp1y)}, ${p(l_bToN_cp2x)} ${p(l_bToN_cp2y)}, ${p(lBelly)} ${p(bellyY)}`,
    // Left side: belly → foot
    `C ${p(l_fToB_cp1x)} ${p(l_fToB_cp1y)}, ${p(l_fToB_cp2x)} ${p(l_fToB_cp2y)}, ${p(lFoot)} ${p(footY)}`,
    // Close along foot
    `Q 32 ${p(footY + 1.5)}, ${p(rFoot)} ${p(footY)}`,
    "Z",
  ].join(" ");
}

// ── Default ───────────────────────────────────────────────────────────────

export const DEFAULT_AVATAR: Avatar = {
  shape: "round-belly",
  glaze: "terracotta",
  pattern: "plain",
};

// Default thrown params (a pleasant medium vase)
export const DEFAULT_THROWN_PARAMS: ThrownParams = {
  h: 0.6,
  b: 0.55,
  n: 0.35,
  l: 0.3,
  f: 0.35,
};

// ── Lookup helpers ────────────────────────────────────────────────────────

export function getShape(id: string): AvatarShapeData {
  return AVATAR_SHAPES.find((s) => s.id === id) ?? AVATAR_SHAPES[0];
}

export function getGlaze(id: string): AvatarGlazeData {
  return AVATAR_GLAZES.find((g) => g.id === id) ?? AVATAR_GLAZES[0];
}

export function getPattern(id: string): AvatarPatternData {
  return AVATAR_PATTERNS.find((p) => p.id === id) ?? AVATAR_PATTERNS[0];
}
