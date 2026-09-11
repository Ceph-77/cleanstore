import { useState } from "react";
import { Button } from "./Button";
import { openMonthlyStatement } from "../../api/documents";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

/** Génère/ouvre le PDF du relevé mensuel d'un travailleur (Q58-60). */
export function MonthlyStatementPicker({ workerId }: { workerId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setError(null);
    setLoading(true);
    try {
      await openMonthlyStatement(workerId, year, month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de générer le relevé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs font-medium text-canvas-800">Mois</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="mt-1 block rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm"
        >
          {MONTH_LABELS.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-canvas-800">Année</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="mt-1 block w-24 rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <Button variant="secondary" onClick={handleOpen} disabled={loading}>
        {loading ? "Génération..." : "Ouvrir le relevé PDF"}
      </Button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
