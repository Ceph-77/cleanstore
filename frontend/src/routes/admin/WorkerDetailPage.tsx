import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { Field } from "../../components/common/Field";
import { Input } from "../../components/common/Input";
import { IconMapPin } from "../../components/common/icons";
import { ApiError } from "../../api/client";
import { useUser } from "../../hooks/useUsers";
import { useStores } from "../../hooks/useStores";
import { useTasks } from "../../hooks/useTasks";
import {
  useWorkerSummary,
  useWorkerStreak,
  useWorkerStreakDay,
  useAddPastTask,
} from "../../hooks/useEngagement";

function Flame({ lit }: { lit: boolean }) {
  return <span className={lit ? "" : "opacity-30 grayscale"} aria-hidden="true">🔥</span>;
}

const emptyForm = { storeId: "", description: "", taskType: "", price: "", inspectionScore: "" };

export function WorkerDetailPage() {
  const { id = "" } = useParams();
  const { data: user } = useUser(id);
  const { data: summary } = useWorkerSummary(id);
  const { data: strip } = useWorkerStreak(id);
  const { data: stores } = useStores();
  const addPastTask = useAddPastTask(id);

  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: storeTasks } = useTasks(form.storeId);
  // Distinct task "templates" already defined for the selected store, so the
  // admin can pick instead of retyping.
  const templates = Array.from(
    new Map(
      (storeTasks ?? []).map((t) => [
        `${t.description}|${t.taskType ?? ""}|${t.price}`,
        { description: t.description, taskType: t.taskType ?? "", price: String(t.price) },
      ])
    ).values()
  );

  const { data: day, isLoading: dayLoading } = useWorkerStreakDay(id, selected);
  const today = strip?.days[strip.days.length - 1];

  useEffect(() => {
    if (!selected && today) setSelected(today.date);
  }, [selected, today]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!selected) return;
    try {
      const res = await addPastTask.mutateAsync({
        storeId: form.storeId,
        description: form.description,
        taskType: form.taskType || undefined,
        price: Number(form.price),
        completedAt: `${selected}T12:00:00`,
        inspectionScore: form.inspectionScore === "" ? undefined : Number(form.inspectionScore),
      });
      setForm(emptyForm);
      setShowForm(false);
      setNotice(
        res.earningCreated
          ? "Travail enregistré. Un gain a été créé pour le travailleur."
          : `Travail enregistré. ${res.earningSkippedReason ?? ""}`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  return (
    <AppLayout>
      <Link to="/admin/users" className="text-xs font-medium text-flow-700 hover:text-flow-900">
        ← Utilisateurs
      </Link>
      <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-canvas-900">
        {user?.fullName ?? user?.email ?? "…"}
      </h1>
      <p className="mt-0.5 text-sm text-canvas-600">{user?.email}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {user?.roles.map((r, i) => (
          <span key={i} className="rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800">
            {r.role.label}
            {r.organization && ` · ${r.organization.name}`}
          </span>
        ))}
      </div>

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Points ce mois", String(summary.pointsThisMonth)],
            ["Points au total", String(summary.pointsTotal)],
            ["Série", `🔥 ${summary.streakDays}`],
            ["Tâches complétées", String(summary.tasksCompleted)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-canvas-50 p-4 text-center">
              <p className="font-heading text-2xl font-bold text-canvas-900">{value}</p>
              <p className="mt-0.5 text-xs font-medium text-canvas-600">{label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-canvas-900">Série — 7 derniers jours</h2>
      {strip && (
        <div className="mt-2 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
          <div className="flex justify-between gap-1.5">
            {strip.days.map((d) => {
              const isSel = d.date === selected;
              const isToday = d.date === today?.date;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    setSelected(d.date);
                    setShowForm(false);
                    setNotice(null);
                  }}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                    isSel ? "bg-flow-50 ring-1 ring-flow-200" : "hover:bg-canvas-50"
                  }`}
                >
                  <span className="text-[11px] font-medium text-canvas-500">{d.label}</span>
                  <Flame lit={d.done} />
                  <span className={`text-[10px] ${isToday ? "font-semibold text-flow-700" : "text-canvas-400"}`}>
                    {isToday ? "auj." : d.date.slice(8)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-canvas-100 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-canvas-600">
                {selected} — {day?.tasks.length ?? 0} tâche{(day?.tasks.length ?? 0) > 1 ? "s" : ""}
              </p>
              {selected && (
                <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
                  {showForm ? "Annuler" : "+ Ajouter une tâche passée"}
                </Button>
              )}
            </div>

            {dayLoading && <p className="mt-2 text-xs text-canvas-500">Chargement…</p>}
            {!dayLoading && day && day.tasks.length > 0 && (
              <ul className="mt-2 space-y-1.5">
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
                    <span className="shrink-0 text-xs text-canvas-500">{Number(t.price).toFixed(2)} $</span>
                  </li>
                ))}
              </ul>
            )}

            {showForm && (
              <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl bg-flow-50/60 p-3">
                <p className="text-xs text-canvas-600">
                  Enregistré comme complété le <strong>{selected}</strong>. Compte dans les points, la
                  série et le classement à cette date.
                </p>
                <Field label="Magasin">
                  <select
                    required
                    className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                    value={form.storeId}
                    onChange={(e) =>
                      setForm({ ...form, storeId: e.target.value, description: "", taskType: "", price: "" })
                    }
                  >
                    <option value="">—</option>
                    {stores?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.city ? ` · ${s.city}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                {form.storeId && templates.length > 0 && (
                  <Field label="Depuis une tâche du magasin (remplit les champs)">
                    <select
                      className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                      value=""
                      onChange={(e) => {
                        const t = templates[Number(e.target.value)];
                        if (t) setForm({ ...form, description: t.description, taskType: t.taskType, price: t.price });
                      }}
                    >
                      <option value="">— Choisir / ou saisir manuellement ci-dessous —</option>
                      {templates.map((t, i) => (
                        <option key={i} value={i}>
                          {t.description}
                          {t.taskType ? ` · ${t.taskType}` : ""} · {Number(t.price).toFixed(2)} $
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Type (optionnel)">
                    <Input value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })} />
                  </Field>
                  <Field label="Description">
                    <Input
                      required
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </Field>
                  <Field label="Prix ($)">
                    <Input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </Field>
                  <Field label="Score d'inspection (optionnel, 0-100)">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.inspectionScore}
                      onChange={(e) => setForm({ ...form, inspectionScore: e.target.value })}
                    />
                  </Field>
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <div className="flex justify-end">
                  <Button type="submit" variant="accent" disabled={addPastTask.isPending}>
                    {addPastTask.isPending ? "Enregistrement…" : "Enregistrer le travail"}
                  </Button>
                </div>
              </form>
            )}

            {notice && (
              <p className="mt-2 rounded-lg bg-flow-50 px-3 py-2 text-xs text-flow-800 ring-1 ring-flow-100">
                {notice}
              </p>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
