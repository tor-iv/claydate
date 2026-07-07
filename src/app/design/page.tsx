import VaseAvatar from "@/components/avatar/VaseAvatar";
import AvatarBuilder from "@/components/avatar/AvatarBuilder";
import WobblyCard from "@/components/ui/WobblyCard";
import InkButton from "@/components/ui/InkButton";
import HandInput from "@/components/ui/HandInput";
import DoodleIcon from "@/components/ui/DoodleIcon";
import StatusChip from "@/components/ui/StatusChip";
import UserTag from "@/components/shared/UserTag";
import ViewToggle from "@/components/shared/ViewToggle";
import PageHeader from "@/components/shared/PageHeader";
import {
  AVATAR_SHAPES,
  AVATAR_GLAZES,
  AVATAR_PATTERNS,
  AVATAR_FACES,
  encodeThrownShape,
  encodeThrown2Shape,
  bandsForHeight,
  resampleWidths,
  DEFAULT_THROWN_PARAMS,
} from "@/lib/avatars";
import type { DoodleName } from "@/components/ui/DoodleIcon";
import type { FaceId } from "@/lib/avatars";

const FAKE_USER = {
  name: "Maya",
  avatarShape: "amphora" as const,
  avatarGlaze: "celadon" as const,
  avatarPattern: "flowers" as const,
};

const DOODLE_NAMES: DoodleName[] = ["pot", "star", "squiggle", "flame", "leaf", "sparkle"];

export default function DesignPage() {
  return (
    <div style={{ fontFamily: "var(--font-body)", color: "#2C1810" }}>
      {/* Page Header preview */}
      <section className="mb-0">
        <PageHeader user={FAKE_USER} />
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-16">

        {/* ── Title ───────────────────────────────────────────────────── */}
        <div className="text-center">
          <h1
            className="text-5xl mb-2"
            style={{ fontFamily: "var(--font-hand)", fontWeight: 700, color: "#B85C2A" }}
          >
            ClayDate Design Gallery
          </h1>
          <p className="text-lg" style={{ fontFamily: "var(--font-body)", color: "#5C3D2E" }}>
            Visual QA surface — all primitives, all variants
          </p>
        </div>

        {/* ── Vase Shapes × Glazes Grid ────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-1"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            All Shapes × Glazes
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7A8C6E" }}>
            {AVATAR_SHAPES.length} shapes × {AVATAR_GLAZES.length} glazes = {AVATAR_SHAPES.length * AVATAR_GLAZES.length} combos
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th
                    className="text-right pr-4 pb-2 text-sm"
                    style={{ fontFamily: "var(--font-hand)", color: "#5C3D2E", fontWeight: 400 }}
                  >
                    shape ↓ / glaze →
                  </th>
                  {AVATAR_GLAZES.map((g) => (
                    <th
                      key={g.id}
                      className="pb-2 px-2 text-xs"
                      style={{
                        fontFamily: "var(--font-hand)",
                        color: "#5C3D2E",
                        fontWeight: 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: g.fill,
                            border: "1.5px solid rgba(44,24,16,0.4)",
                          }}
                        />
                        {g.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AVATAR_SHAPES.map((s) => (
                  <tr key={s.id}>
                    <td
                      className="pr-4 py-1 text-sm text-right"
                      style={{
                        fontFamily: "var(--font-hand)",
                        color: "#5C3D2E",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                    </td>
                    {AVATAR_GLAZES.map((g) => (
                      <td key={g.id} className="px-2 py-1">
                        <VaseAvatar shape={s.id} glaze={g.id} pattern="plain" size={44} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Patterns Row ─────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            Patterns (on Round Belly / Terracotta)
          </h2>
          <div className="flex flex-wrap gap-6 items-end">
            {AVATAR_PATTERNS.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <VaseAvatar shape="round-belly" glaze="terracotta" pattern={p.id} size={64} />
                <span
                  className="text-sm"
                  style={{ fontFamily: "var(--font-hand)", color: "#5C3D2E" }}
                >
                  {p.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 items-end mt-6">
            {AVATAR_PATTERNS.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <VaseAvatar shape="amphora" glaze="cobalt" pattern={p.id} size={64} />
                <span
                  className="text-sm"
                  style={{ fontFamily: "var(--font-hand)", color: "#5C3D2E" }}
                >
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Thrown Vase Gallery ──────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-1"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            Thrown Vases × Faces
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7A8C6E" }}>
            Parametric thrown shapes with the 5 face expressions
          </p>
          <div className="flex flex-wrap gap-8 items-end">
            {(["none", "happy", "sleepy", "winky", "surprised"] as FaceId[]).map((faceId) => {
              // Vary params a bit per face for visual interest
              const paramVariants: Record<FaceId, typeof DEFAULT_THROWN_PARAMS> = {
                none:      { h: 0.7, b: 0.6, n: 0.4, l: 0.3, f: 0.35 },
                happy:     { h: 0.6, b: 0.72, n: 0.35, l: 0.25, f: 0.4 },
                sleepy:    { h: 0.8, b: 0.45, n: 0.38, l: 0.2, f: 0.3 },
                winky:     { h: 0.55, b: 0.65, n: 0.5, l: 0.45, f: 0.35 },
                surprised: { h: 0.75, b: 0.5, n: 0.3, l: 0.15, f: 0.28 },
              };
              const faceLabel = AVATAR_FACES.find((f) => f.id === faceId)?.label ?? faceId;
              const shapeStr = encodeThrownShape(paramVariants[faceId], faceId);
              return (
                <div key={faceId} className="flex flex-col items-center gap-2">
                  <VaseAvatar shape={shapeStr} glaze="terracotta" pattern="plain" size={80} />
                  <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.85rem", color: "#5C3D2E" }}>
                    {faceLabel}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Same faces on different glazes */}
          <div className="flex flex-wrap gap-6 items-end mt-8">
            {(["celadon", "cobalt", "honey", "blush-gloss", "midnight"] as const).map((glazeId, i) => {
              const faceIds: FaceId[] = ["happy", "winky", "sleepy", "surprised", "happy"];
              const shapeStr = encodeThrownShape(
                { h: 0.55 + i * 0.08, b: 0.6, n: 0.35 + i * 0.05, l: 0.3, f: 0.38 },
                faceIds[i]
              );
              return (
                <div key={glazeId} className="flex flex-col items-center gap-2">
                  <VaseAvatar shape={shapeStr} glaze={glazeId} pattern="dots" size={72} />
                  <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.8rem", color: "#5C3D2E" }}>
                    {glazeId}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Thrown2 Dynamic Bands Gallery ───────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-1"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            Thrown2 — Height-Driven Bands
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7A8C6E" }}>
            2 bands (shortest) → 6 bands (tallest), plus edge styles. Each vase uses <code>thrown2:</code> encoding.
          </p>
          {/* Row: squat 2-band, mid 4-band, tall 6-band, angular example */}
          <div className="flex flex-wrap gap-8 items-end">
            {([
              { numBands: 2, label: "squat 2-band", face: "happy" as FaceId, edge: 0, glaze: "terracotta" },
              { numBands: 3, label: "mid 3-band",   face: "winky" as FaceId, edge: 0, glaze: "celadon" },
              { numBands: 4, label: "tall 4-band",  face: "sleepy" as FaceId, edge: 0, glaze: "cobalt" },
              { numBands: 4, label: "angular ◇",   face: "surprised" as FaceId, edge: 1, glaze: "honey" },
            ]).map(({ numBands, label, face: faceId, edge, glaze: glazeId }) => {
              // Derive h from bandsForHeight inverse: 2+round(h*2)=n → h=(n-2)/2
              const h = (numBands - 2) / 2;
              // Gentle S-curve widths: foot narrow, belly wide, neck narrow, lip flared
              const sCurveBase = [0.32, 0.5, 0.72, 0.55, 0.35, 0.42];
              const widths = resampleWidths(sCurveBase, numBands);
              const shapeStr = encodeThrown2Shape(h, widths, faceId, edge);
              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <VaseAvatar shape={shapeStr} glaze={glazeId} pattern="plain" size={80} />
                  <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.85rem", color: "#5C3D2E" }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#7A8C6E" }}>
                    h≈{h.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Second row: same bands on different glazes with different faces */}
          <div className="flex flex-wrap gap-6 items-end mt-8">
            {(["celadon", "cobalt", "honey", "midnight"] as const).map((glazeId, i) => {
              // 2, 3, 4, 6 bands for visual variety
              const bandCounts = [2, 3, 4, 6];
              const numBands = bandCounts[i];
              const h = (numBands - 2) / 4;
              const widths = resampleWidths([0.4, 0.65, 0.8, 0.6, 0.35], numBands);
              const faces: FaceId[] = ["winky", "sleepy", "surprised", "happy"];
              const shapeStr = encodeThrown2Shape(h, widths, faces[i]);
              return (
                <div key={glazeId} className="flex flex-col items-center gap-2">
                  <VaseAvatar shape={shapeStr} glaze={glazeId} pattern="squiggle" size={72} />
                  <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.8rem", color: "#5C3D2E" }}>
                    {glazeId}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Avatar Builder (Pottery Wheel Minigame) ──────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            Avatar Builder — Pottery Wheel
          </h2>
          <WobblyCard className="max-w-md lg:max-w-4xl">
            <AvatarBuilder />
          </WobblyCard>
        </section>

        {/* ── Buttons ──────────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            InkButton variants
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <InkButton variant="primary">
              <DoodleIcon name="sparkle" size={16} color="#F5F0E8" />
              Primary Button
            </InkButton>
            <InkButton variant="ghost">
              <DoodleIcon name="leaf" size={16} color="#2C1810" />
              Ghost Button
            </InkButton>
            <InkButton variant="soft">
              <DoodleIcon name="star" size={16} color="#2C1810" />
              Soft Button
            </InkButton>
            <InkButton variant="primary" disabled>
              Disabled
            </InkButton>
          </div>
        </section>

        {/* ── Inputs ───────────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            HandInput variants
          </h2>
          <WobblyCard className="max-w-md flex flex-col gap-5">
            <HandInput label="Your name" placeholder="e.g. Maya" />
            <HandInput label="Meetup title" placeholder="Wheel throwing Sunday" />
            <HandInput
              as="textarea"
              label="Notes"
              placeholder="Bring your own apron..."
            />
          </WobblyCard>
        </section>

        {/* ── StatusChips ──────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            StatusChip — RSVP states
          </h2>
          <div className="flex flex-wrap gap-3">
            <StatusChip status="yes" />
            <StatusChip status="maybe" />
            <StatusChip status="no" />
          </div>
        </section>

        {/* ── WobblyCard tones ─────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            WobblyCard tones
          </h2>
          <div className="flex flex-wrap gap-6">
            <WobblyCard tone="cream" className="max-w-xs">
              <h3 className="text-xl mb-1" style={{ fontFamily: "var(--font-hand)" }}>
                Cream Card
              </h3>
              <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>
                This is a cream-toned wobbly card. Great for main content areas.
              </p>
            </WobblyCard>
            <WobblyCard tone="warm" className="max-w-xs">
              <h3 className="text-xl mb-1" style={{ fontFamily: "var(--font-hand)" }}>
                Warm Card
              </h3>
              <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>
                This is a warm-toned wobbly card. Slightly more emphasized feeling.
              </p>
            </WobblyCard>
          </div>
        </section>

        {/* ── DoodleIcons ──────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            DoodleIcons
          </h2>
          <div className="flex flex-wrap gap-6 items-end">
            {DOODLE_NAMES.map((name) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="flex gap-3 items-center">
                  <DoodleIcon name={name} size={20} color="#2C1810" />
                  <DoodleIcon name={name} size={32} color="#B85C2A" />
                  <DoodleIcon name={name} size={44} color="#7A8C6E" />
                </div>
                <span
                  className="text-xs"
                  style={{ fontFamily: "var(--font-hand)", color: "#5C3D2E" }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── UserTag ──────────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            UserTag
          </h2>
          <div className="flex flex-wrap gap-4">
            <UserTag user={FAKE_USER} />
            <UserTag
              user={{
                name: "Priya",
                avatarShape: "gourd",
                avatarGlaze: "cobalt",
                avatarPattern: "dots",
              }}
            />
            <UserTag
              user={{
                name: "Sam",
                avatarShape: "tall-slim",
                avatarGlaze: "honey",
                avatarPattern: "stripes",
              }}
            />
            <UserTag
              user={{
                name: "Jordan",
                avatarShape: "squat-wide",
                avatarGlaze: "midnight",
                avatarPattern: "squiggle",
              }}
            />
          </div>
        </section>

        {/* ── ViewToggle ───────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            ViewToggle
          </h2>
          <div className="flex gap-6 items-center flex-wrap">
            <div className="flex flex-col gap-2">
              <span
                className="text-xs"
                style={{ fontFamily: "var(--font-hand)", color: "#7A8C6E" }}
              >
                active: month
              </span>
              <ViewToggle active="month" />
            </div>
            <div className="flex flex-col gap-2">
              <span
                className="text-xs"
                style={{ fontFamily: "var(--font-hand)", color: "#7A8C6E" }}
              >
                active: list
              </span>
              <ViewToggle active="list" />
            </div>
          </div>
        </section>

        {/* ── PageHeader w/ no user ────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-4"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            PageHeader (logged-out state)
          </h2>
          <div
            style={{
              border: "2px dashed rgba(44,24,16,0.2)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <PageHeader user={null} />
          </div>
        </section>

        {/* ── Color Palette ────────────────────────────────────────── */}
        <section>
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            Color Tokens
          </h2>
          <div className="flex flex-wrap gap-4">
            {[
              { name: "clay-cream",  hex: "#F5F0E8" },
              { name: "clay-ink",    hex: "#2C1810" },
              { name: "clay-rust",   hex: "#B85C2A" },
              { name: "clay-sage",   hex: "#7A8C6E" },
              { name: "clay-warm",   hex: "#E8D5B0" },
              { name: "clay-sky",    hex: "#7EB5C8" },
              { name: "clay-blush",  hex: "#D4847A" },
            ].map(({ name, hex }) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    background: hex,
                    border: "2px solid rgba(44,24,16,0.3)",
                  }}
                />
                <span
                  className="text-xs"
                  style={{ fontFamily: "var(--font-hand)", color: "#5C3D2E" }}
                >
                  {name}
                </span>
                <span
                  className="text-xs"
                  style={{ fontFamily: "var(--font-body)", color: "#7A8C6E" }}
                >
                  {hex}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ───────────────────────────────────────────── */}
        <section className="pb-16">
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-hand)", color: "#2C1810" }}
          >
            Typography Scale
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { size: "3rem", weight: 700, font: "var(--font-hand)", label: "Heading XL — Caveat 700" },
              { size: "2rem", weight: 700, font: "var(--font-hand)", label: "Heading L — Caveat 700" },
              { size: "1.5rem", weight: 400, font: "var(--font-hand)", label: "Heading M — Caveat 400" },
              { size: "1.1rem", weight: 400, font: "var(--font-body)", label: "Body — Patrick Hand. We make pots and we have fun." },
              { size: "0.9rem", weight: 400, font: "var(--font-body)", label: "Small — Patrick Hand. Meetup notes and captions." },
            ].map(({ size, weight, font, label }) => (
              <p
                key={label}
                style={{
                  fontFamily: font,
                  fontSize: size,
                  fontWeight: weight,
                  color: "#2C1810",
                  lineHeight: 1.3,
                }}
              >
                {label}
              </p>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
