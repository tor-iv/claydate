import Link from "next/link";

interface ViewToggleProps {
  active: "month" | "week" | "list";
}

export default function ViewToggle({ active }: ViewToggleProps) {
  const base = `
    px-4 py-1.5 text-sm rounded-full transition-all leading-none
  `;
  const activeStyle = {
    background: "#2C1810",
    color: "#F5F0E8",
    fontFamily: "var(--font-hand)",
    border: "1.5px solid #2C1810",
  };
  const inactiveStyle = {
    background: "transparent",
    color: "#2C1810",
    fontFamily: "var(--font-hand)",
    border: "1.5px solid rgba(44,24,16,0.35)",
  };

  const views = [
    { id: "month" as const, label: "Month", href: "/calendar" },
    { id: "week" as const, label: "Week", href: "/calendar/week" },
    { id: "list" as const, label: "List", href: "/calendar/upcoming" },
  ];

  return (
    <div
      className="inline-flex rounded-full p-0.5"
      style={{ background: "rgba(232,213,176,0.5)", border: "1.5px solid rgba(44,24,16,0.2)" }}
    >
      {views.map((v) => (
        <Link
          key={v.id}
          href={v.href}
          className={base}
          style={active === v.id ? activeStyle : inactiveStyle}
          aria-current={active === v.id ? "page" : undefined}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
