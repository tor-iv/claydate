import DoodleIcon from "./DoodleIcon";

export type RsvpStatus = "yes" | "no" | "maybe";

interface StatusChipProps {
  status: RsvpStatus;
  className?: string;
}

const CONFIG = {
  yes: {
    label: "Going!",
    bg: "#7EB5C8",
    border: "#2C1810",
    color: "#2C1810",
    icon: "sparkle" as const,
  },
  no: {
    label: "Can't make it",
    bg: "transparent",
    border: "#2C1810",
    color: "#2C1810",
    icon: "squiggle" as const,
  },
  maybe: {
    label: "Maybe~",
    bg: "#D4847A",
    border: "#2C1810",
    color: "#2C1810",
    icon: "flame" as const,
  },
};

export default function StatusChip({ status, className = "" }: StatusChipProps) {
  const cfg = CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm leading-none ${className}`}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        color: cfg.color,
        fontFamily: "var(--font-hand)",
      }}
    >
      <DoodleIcon name={cfg.icon} size={14} color={cfg.color} />
      {cfg.label}
    </span>
  );
}
