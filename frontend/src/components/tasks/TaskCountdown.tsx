import { useEffect, useState } from "react";

function formatMinutes(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, "0")}`;
}

/**
 * Purely informational: elapsed time next to the client's *estimate*. No
 * deadline, no "overdue" alarm — the worker is an autonomous contractor, the
 * estimate is a guide, not a clock to beat.
 */
export function TaskCountdown({
  startedAt,
  estimatedDurationMinutes,
}: {
  startedAt: string;
  estimatedDurationMinutes: number;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = now - new Date(startedAt).getTime();

  return (
    <span className="inline-flex items-center rounded-full bg-canvas-100 px-2.5 py-0.5 text-xs font-medium text-canvas-700 ring-1 ring-inset ring-canvas-200">
      Écoulé&nbsp;{formatMinutes(elapsed)} · estimé&nbsp;{formatMinutes(estimatedDurationMinutes * 60000)}
    </span>
  );
}
