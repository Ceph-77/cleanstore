import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function StatCard({
  label,
  value,
  icon,
  accent = "flow",
  to,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "flow" | "linen";
  to?: string;
}) {
  const iconBg = accent === "flow" ? "bg-flow-100 text-flow-700" : "bg-linen-100 text-linen-700";

  const content = (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5 ${
        to ? "transition hover:-translate-y-0.5 hover:border-flow-300 hover:shadow-md" : ""
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${iconBg}`}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-canvas-600">{label}</p>
        <p className="font-heading text-2xl font-semibold text-canvas-900">{value}</p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
