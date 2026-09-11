import { AppLayout } from "../components/common/AppLayout";
import { useLeaderboard } from "../hooks/useEngagement";
import type { BadgeKey } from "../types";

const BADGE_LABELS: Record<BadgeKey, string> = {
  fiable: "Fiable",
  ponctuel: "Ponctuel",
  qualite: "Qualité",
  veteran: "Vétéran",
  polyvalent: "Polyvalent",
  sur_la_cible: "Sur la cible",
  habitue: "Habitué",
};

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

export function LeaderboardPage() {
  const { data: rows, isLoading } = useLeaderboard();

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Engagement</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Classement</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Points, ponctualité et qualité des travailleurs — le mois en cours.
      </p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {rows && rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">Aucun point enregistré pour l'instant.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-canvas-200 text-left text-xs uppercase tracking-wide text-canvas-500">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Travailleur</th>
                <th className="px-4 py-3 text-right font-semibold">Points (mois)</th>
                <th className="px-4 py-3 text-right font-semibold">Points (total)</th>
                <th className="px-4 py-3 text-right font-semibold">Tâches</th>
                <th className="px-4 py-3 text-right font-semibold">À l'heure</th>
                <th className="px-4 py-3 text-right font-semibold">Qualité moy.</th>
                <th className="px-4 py-3 font-semibold">Badges</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.workerId} className="border-b border-canvas-100 last:border-0">
                  <td className="px-4 py-3 text-base">{medal(r.rank)}</td>
                  <td className="px-4 py-3 font-medium text-canvas-900">{r.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-canvas-900">{r.pointsThisMonth}</td>
                  <td className="px-4 py-3 text-right text-canvas-600">{r.pointsTotal}</td>
                  <td className="px-4 py-3 text-right text-canvas-600">{r.tasksThisMonth}</td>
                  <td className="px-4 py-3 text-right text-canvas-600">
                    {r.onTimeRate == null ? "—" : `${Math.round(r.onTimeRate * 100)} %`}
                  </td>
                  <td className="px-4 py-3 text-right text-canvas-600">
                    {r.avgQuality == null ? "—" : `${r.avgQuality}/100`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.badges.map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-flow-100 px-2 py-0.5 text-[11px] font-medium text-flow-700"
                        >
                          {BADGE_LABELS[b]}
                        </span>
                      ))}
                      {r.badges.length === 0 && <span className="text-xs text-canvas-400">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
