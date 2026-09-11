import { Link } from "react-router-dom";
import { useMyRewards } from "../../hooks/useRewards";

function pct(n: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)} %`;
}

export function RewardBadges() {
  const { data } = useMyRewards();
  if (!data) return null;
  const { metrics, badges } = data;

  return (
    <div className="mt-6 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-canvas-900">Mes badges</h2>
        <Link to="/rewards" className="text-xs font-medium text-flow-700 hover:text-flow-900">
          Voir plus →
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {badges.length === 0 && <p className="text-xs text-canvas-500">Aucun badge pour l'instant.</p>}
        {badges.map((b) => (
          <span
            key={b.key}
            className="rounded-full bg-flow-100 px-2.5 py-1 text-xs font-medium text-flow-700"
          >
            {b.label}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-canvas-600 sm:grid-cols-3">
        <p>Fiabilité : {pct(metrics.reliability)}</p>
        <p>Ponctualité : {pct(metrics.punctuality)}</p>
        <p>Qualité : {metrics.quality == null ? "—" : `${Math.round(metrics.quality)}/100`}</p>
        <p>Tâches : {metrics.experience.tasksCompleted}</p>
        <p>Catégories : {metrics.experience.categoryVariety}</p>
        <p>Ancienneté : {metrics.seniorityDays} j</p>
      </div>
    </div>
  );
}
