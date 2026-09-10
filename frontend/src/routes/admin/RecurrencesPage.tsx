import { useMemo } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import {
  useRecurrences,
  useSkipRecurrence,
  useSetStoreRecurrencePause,
} from "../../hooks/useRecurrences";
import type { RecurrenceRow } from "../../api/recurrences";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  open: "générée, libre",
  claimed: "réservée",
  in_progress: "en cours",
  completed: "complétée",
  inspected: "inspectée",
  cancelled: "annulée / sautée",
};

function isSkippedToday(r: RecurrenceRow): boolean {
  return (
    (r.recurrenceSkipDate != null && r.recurrenceSkipDate.slice(0, 10) === todayKey()) ||
    r.todayInstance?.status === "cancelled"
  );
}

function RecurrenceItem({ r }: { r: RecurrenceRow }) {
  const skip = useSkipRecurrence();
  const skipped = isSkippedToday(r);
  const reserved =
    r.todayInstance != null && !["open", "cancelled"].includes(r.todayInstance.status);

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-canvas-100 py-3 first:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-canvas-900">{r.description}</p>
        <p className="mt-0.5 text-xs text-canvas-600">
          {Number(r.price).toFixed(2)} $ · aujourd'hui :{" "}
          {r.todayInstance
            ? (STATUS_LABEL[r.todayInstance.status] ?? r.todayInstance.status)
            : "pas encore générée"}
          {skipped && !r.todayInstance && " · sautée"}
        </p>
      </div>
      {reserved ? (
        <span className="rounded-full bg-canvas-100 px-2.5 py-0.5 text-xs font-medium text-canvas-600">
          déjà réservée — non modifiable
        </span>
      ) : (
        <Button
          variant={skipped ? "secondary" : "danger"}
          disabled={skip.isPending}
          onClick={() => skip.mutate({ id: r.id, skip: !skipped })}
        >
          {skipped ? "Réactiver aujourd'hui" : "Sauter aujourd'hui"}
        </Button>
      )}
    </div>
  );
}

export function RecurrencesPage() {
  const { data, isLoading } = useRecurrences();
  const pause = useSetStoreRecurrencePause();

  const byStore = useMemo(() => {
    const map = new Map<string, { store: RecurrenceRow["store"]; rows: RecurrenceRow[] }>();
    for (const r of data ?? []) {
      const g = map.get(r.store.id) ?? { store: r.store, rows: [] };
      g.rows.push(r);
      map.set(r.store.id, g);
    }
    return [...map.values()].sort((a, b) => a.store.name.localeCompare(b.store.name));
  }, [data]);

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Récurrences</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Avant 15 h, saute la génération d'un modèle récurrent pour aujourd'hui, ou mets tout un
        magasin en pause. Les tâches déjà réservées ne sont pas touchées.
      </p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && byStore.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune tâche récurrente. Marque une tâche comme « récurrente » sur la fiche d'un magasin.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {byStore.map(({ store, rows }) => (
          <div
            key={store.id}
            className="overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-200 px-5 py-3">
              <div>
                <p className="font-heading text-sm font-semibold text-canvas-900">
                  {store.name}
                  {store.city && <span className="ml-1 text-canvas-500">· {store.city}</span>}
                </p>
                {store.recurrencePaused && (
                  <span className="mt-0.5 inline-block rounded-full bg-linen-100 px-2 py-0.5 text-[11px] font-semibold text-linen-800">
                    Récurrence du magasin en pause
                  </span>
                )}
              </div>
              <Button
                variant={store.recurrencePaused ? "primary" : "secondary"}
                disabled={pause.isPending}
                onClick={() => pause.mutate({ storeId: store.id, paused: !store.recurrencePaused })}
              >
                {store.recurrencePaused ? "Reprendre la récurrence" : "Mettre en pause"}
              </Button>
            </div>
            <div className="px-5">
              {rows.map((r) => (
                <RecurrenceItem key={r.id} r={r} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
