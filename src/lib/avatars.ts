// ── Avatar System ─────────────────────────────────────────────────────────
// This file is the canonical contract for all avatar data.
// Other phases import from here; do not rename exports.

export type AvatarShape =
  | "round-belly"
  | "tall-slim"
  | "amphora"
  | "squat-wide"
  | "gourd"
  | "flared-rim";

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
  id: AvatarShape;
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

// ── Default ───────────────────────────────────────────────────────────────

export const DEFAULT_AVATAR: Avatar = {
  shape: "round-belly",
  glaze: "terracotta",
  pattern: "plain",
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
