import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
  accent = "flow",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "flow" | "linen";
}) {
  const iconBg = accent === "flow" ? "bg-flow-100 text-flow-700" : "bg-linen-100 text-linen-700";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <span className="h-5 w-5">{icon}</span>
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-canvas-600">{label}</p>
        <p className="font-heading text-2xl font-semibold text-canvas-900">{value}</p>
      </div>
    </div>
  );
}
