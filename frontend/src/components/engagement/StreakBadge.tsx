import { useEffect, useState } from "react";
import { useStreak, useStreakDay } from "../../hooks/useEngagement";
import { StreakHistory } from "./StreakHistory";
import { IconMapPin } from "../common/icons";

function Flame({ lit }: { lit: boolean }) {
  return (
    <span className={`text-base ${lit ? "" : "opacity-30 grayscale"}`} aria-hidden="true">
      🔥
    </span>
  );
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function StreakBadge() {
  const { data: strip } = useStreak();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: day, isLoading } = useStreakDay(open ? selected : null);

  const litToday = strip?.days[strip.days.length - 1]?.done ?? false;

  useEffect(() => {
    if (open && !selected) setSelected(todayKey());
  }, [open, selected]);

  if (!strip) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
          litToday
            ? "border-linen-300 bg-linen-100 text-linen-900"
            : "border-canvas-200 bg-white text-canvas-600"
        }`}
      >
        <Flame lit={litToday} />
        <span>
          {strip.streakDays} jour{strip.streakDays > 1 ? "s" : ""}
        </span>
        <span className="text-xs font-normal text-canvas-500">
          {litToday ? "· série active" : "· fais une tâche aujourd'hui"}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
          <StreakHistory selected={selected} onSelect={setSelected} />

          <div className="mt-3 border-t border-canvas-100 pt-3">
            {isLoading && <p className="text-xs text-canvas-500">Chargement…</p>}
            {!isLoading && day && day.tasks.length === 0 && (
              <p className="text-xs text-canvas-500">
                {selected} — aucune tâche complétée ce jour-là.
                {selected === todayKey() && " La série est en jeu — complète une tâche aujourd'hui."}
              </p>
            )}
            {!isLoading && day && day.tasks.length > 0 && (
              <>
                <p className="mb-1.5 text-xs font-medium text-canvas-600">
                  {selected} — {day.tasks.length} tâche{day.tasks.length > 1 ? "s" : ""}
                </p>
                <ul className="space-y-1.5">
                  {day.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      <span className="text-linen-600">✓</span>
                      <span className="min-w-0 flex-1 truncate text-canvas-900">
                        {t.description}
                        {t.taskType && <span className="text-canvas-500"> ({t.taskType})</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-canvas-500">
                        <IconMapPin className="h-3 w-3" />
                        {t.store.name}
                      </span>
                      <span className="shrink-0 text-xs text-canvas-500">
                        {new Date(t.completedAt).toLocaleTimeString("fr-CA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
