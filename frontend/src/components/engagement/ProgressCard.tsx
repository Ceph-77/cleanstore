import { useState } from "react";
import { useMyEngagement } from "../../hooks/useEngagement";
import { isSoundMuted, setSoundMuted, playChime } from "../../utils/sound";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-canvas-50 p-4 text-center">
      <p className="font-heading text-2xl font-bold text-canvas-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-canvas-600">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-canvas-500">{hint}</p>}
    </div>
  );
}

export function ProgressCard() {
  const { data: summary } = useMyEngagement();
  const [muted, setMuted] = useState(isSoundMuted());
  if (!summary) return null;

  return (
    <div className="mt-6 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-canvas-900">Ma progression</h2>
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setSoundMuted(next);
            if (!next) playChime("success");
          }}
          className="text-xs font-medium text-canvas-600 hover:text-canvas-900"
        >
          {muted ? "🔇 Sons coupés" : "🔊 Sons"}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Points ce mois" value={String(summary.pointsThisMonth)} />
        <Stat label="Points au total" value={String(summary.pointsTotal)} />
        <Stat
          label="Série"
          value={`🔥 ${summary.streakDays}`}
          hint={summary.streakDays === 1 ? "jour" : "jours"}
        />
        <Stat label="Tâches complétées" value={String(summary.tasksCompleted)} />
      </div>
    </div>
  );
}
