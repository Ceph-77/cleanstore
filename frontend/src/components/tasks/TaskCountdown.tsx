import { useEffect, useState } from "react";

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function TaskCountdown({
  startedAt,
  estimatedDurationMinutes,
}: {
  startedAt: string;
  estimatedDurationMinutes: number;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const deadline = new Date(startedAt).getTime() + estimatedDurationMinutes * 60000;
  const remaining = deadline - now;
  const overdue = remaining < 0;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        overdue ? "bg-red-50 text-red-700 ring-red-200" : "bg-flow-100 text-flow-800 ring-flow-200"
      }`}
    >
      {overdue ? `Dépassé de ${formatDuration(-remaining)}` : `Temps restant : ${formatDuration(remaining)}`}
    </span>
  );
}
