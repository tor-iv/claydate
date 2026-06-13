import { getShape, getGlaze, getPattern } from "@/lib/avatars";
import type { AvatarShape, AvatarGlaze, AvatarPattern } from "@/lib/avatars";

interface VaseAvatarProps {
  shape?: AvatarShape | string;
  glaze?: AvatarGlaze | string;
  pattern?: AvatarPattern | string;
  size?: number;
  className?: string;
}

/** Darken a hex color by mixing with ink */
function darkenFill(hex: string, amount = 0.3): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const ink = [0x2c, 0x18, 0x10];
  const nr = Math.round(r + (ink[0] - r) * amount);
  const ng = Math.round(g + (ink[1] - g) * amount);
  const nb = Math.round(b + (ink[2] - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

/** Lighten a hex color by mixing with cream */
function lightenFill(hex: string, amount = 0.4): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const cream = [0xf5, 0xf0, 0xe8];
  const nr = Math.round(r + (cream[0] - r) * amount);
  const ng = Math.round(g + (cream[1] - g) * amount);
  const nb = Math.round(b + (cream[2] - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

export default function VaseAvatar({
  shape: shapeProp,
  glaze: glazeProp,
  pattern: patternProp,
  size = 32,
  className,
}: VaseAvatarProps) {
  const shapeData  = getShape(shapeProp  ?? "round-belly");
  const glazeData  = getGlaze(glazeProp  ?? "terracotta");
  const patternId  = (patternProp ?? "plain") as AvatarPattern;

  const uid = `${shapeData.id}-${glazeData.id}-${patternId}-${size}`;
  const clipId = `clip-${uid}`;
  const patId  = `pat-${uid}`;

  const fill        = glazeData.fill;
  const patternFill = darkenFill(fill, 0.28);
  const patternFillLight = lightenFill(fill, 0.35);
  const ink         = "#2C1810";

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
          <path d={shapeData.path} />
        </clipPath>
        {renderPatternDef()}
      </defs>

      {/* Vase fill */}
      <path
        d={shapeData.path}
        fill={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pattern overlay (clipped to vase) */}
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

      {/* Ink outline – hand-drawn feel with slight dasharray */}
      <path
        d={shapeData.path}
        fill="none"
        stroke={ink}
        strokeWidth={size < 40 ? 1.8 : 2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Subtle glaze highlight */}
      <path
        d={shapeData.path}
        fill="none"
        stroke={lightenFill(fill, 0.6)}
        strokeWidth={size < 40 ? 1 : 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 28"
        strokeDashoffset="6"
        opacity="0.7"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
