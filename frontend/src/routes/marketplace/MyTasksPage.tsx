import { useEffect, useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { TaskStatusBadge } from "../../components/tasks/TaskStatusBadge";
import { TaskCountdown } from "../../components/tasks/TaskCountdown";
import { IconTasks, IconMapPin, IconFile } from "../../components/common/icons";
import {
  useMyTasks,
  useUpdateMyTaskStatus,
  useMyTaskInspection,
  useToggleMyTaskStep,
} from "../../hooks/useMyTasks";
import { useMyTaskClaims } from "../../hooks/useMarketplace";
import { useMarkDecisionsSeen } from "../../hooks/useNotifications";
import { StreakBadge } from "../../components/engagement/StreakBadge";
import { getCurrentPosition } from "../../utils/geo";
import type { Task } from "../../types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA");
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-flow-100 text-flow-800 ring-flow-200";
  if (score >= 50) return "bg-linen-100 text-linen-800 ring-linen-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

function InspectionDetails({ taskId }: { taskId: string }) {
  const { data: inspection, isLoading } = useMyTaskInspection(taskId, true);

  if (isLoading) return <p className="mt-3 text-xs text-canvas-600">Chargement de l'inspection...</p>;
  if (!inspection) return <p className="mt-3 text-xs text-canvas-600">Aucun détail d'inspection disponible.</p>;

  return (
    <div className="mt-3 rounded-xl bg-canvas-50 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreColor(inspection.score)}`}
        >
          {inspection.score}/100
        </span>
        <span className="text-xs text-canvas-600">{formatDate(inspection.createdAt)}</span>
      </div>
      {inspection.notes && <p className="mt-2 whitespace-pre-line text-sm text-canvas-900">{inspection.notes}</p>}
      {inspection.photos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {inspection.photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-canvas-700 ring-1 ring-canvas-200 hover:bg-canvas-100"
            >
              <IconFile className="h-3 w-3" />
              {photo.photoType === "before" ? "Avant" : "Après"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function InstructionsDetails({ task }: { task: Task }) {
  const toggleStep = useToggleMyTaskStep();

  return (
    <div className="mt-3 rounded-xl bg-canvas-50 p-3">
      {task.howToText && (
        <p className="whitespace-pre-line text-sm text-canvas-900">{task.howToText}</p>
      )}
      {task.steps && task.steps.length > 0 && (
        <>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-canvas-500">
            Points de contrôle — auto-vérification
          </p>
          <ul className="mt-1 space-y-1.5">
          {task.steps.map((step) => (
            <li key={step.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-canvas-300 text-flow-600 focus:ring-flow-400"
                checked={step.isDone}
                onChange={(e) =>
                  toggleStep.mutate({ taskId: task.id, stepId: step.id, isDone: e.target.checked })
                }
              />
              <span className={step.isDone ? "text-canvas-500 line-through" : "text-canvas-900"}>{step.text}</span>
            </li>
          ))}
          </ul>
        </>
      )}
      {!task.howToText && (!task.steps || task.steps.length === 0) && (
        <p className="text-xs text-canvas-600">Aucune précision fournie pour cette tâche.</p>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const updateStatus = useUpdateMyTaskStatus();
  const [showNoteField, setShowNoteField] = useState(false);
  const [note, setNote] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [showInspection, setShowInspection] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [startNote, setStartNote] = useState<string | null>(null);
  const [showStartField, setShowStartField] = useState(false);
  const [startOdo, setStartOdo] = useState("");
  const [endOdo, setEndOdo] = useState("");

  const needsOdometer = task.requiresOdometer;
  const needsMetric = task.metricTarget != null && !needsOdometer;
  const needsUnits = task.paymentMode === "per_unit";

  async function handleComplete() {
    setCompleteError(null);
    if (needsMetric && metricValue.trim() === "") {
      setCompleteError(`Saisis « ${task.metricLabel ?? "la valeur réalisée"} » avant de confirmer.`);
      return;
    }
    if (needsUnits && unitValue.trim() === "") {
      setCompleteError(`Saisis « ${task.unitLabel ?? "le nombre réalisé"} » avant de confirmer.`);
      return;
    }
    if (needsOdometer && endOdo.trim() === "") {
      setCompleteError("Relève le compteur de la machine avant de confirmer.");
      return;
    }
    try {
      await updateStatus.mutateAsync({
        taskId: task.id,
        status: "completed",
        note: note || undefined,
        reportedMetricValue: needsMetric ? Number(metricValue) : undefined,
        reportedUnits: needsUnits ? Number(unitValue) : undefined,
        endOdometer: needsOdometer ? Number(endOdo) : undefined,
      });
      setShowNoteField(false);
      setNote("");
      setMetricValue("");
      setUnitValue("");
      setEndOdo("");
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "Impossible de marquer complétée.");
    }
  }

  async function handleStart() {
    setStartError(null);
    setStartNote(null);
    if (needsOdometer && !showStartField) {
      setShowStartField(true);
      return;
    }
    if (needsOdometer && startOdo.trim() === "") {
      setStartError("Relève le compteur de la machine avant de démarrer.");
      return;
    }
    setLocating(true);
    // Position is best-effort: a denial or timeout must not block the start.
    let position: Awaited<ReturnType<typeof getCurrentPosition>> | undefined;
    try {
      position = await getCurrentPosition();
    } catch {
      position = undefined;
    }
    try {
      const { task: updated } = await updateStatus.mutateAsync({
        taskId: task.id,
        status: "in_progress",
        position,
        startOdometer: needsOdometer ? Number(startOdo) : undefined,
      });
      if (updated.startGeoNote) setStartNote(updated.startGeoNote);
      setShowStartField(false);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Impossible de démarrer la tâche.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
          <IconTasks className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-canvas-900">
            {task.description}
            {task.taskType && <span className="ml-1 text-canvas-600">({task.taskType})</span>}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-canvas-600">
            <IconMapPin className="h-3 w-3 shrink-0" />
            {task.store?.name} · {task.store?.city ?? "—"}
          </p>
        </div>
        <p className="font-heading font-semibold text-canvas-900">{Number(task.price).toFixed(2)} $</p>
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          {task.status === "in_progress" && task.startedAt && (
            <TaskCountdown
              startedAt={task.startedAt}
              estimatedDurationMinutes={task.estimatedDurationMinutes}
            />
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {(task.howToText || (task.steps && task.steps.length > 0)) && (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setShowInstructions((v) => !v)}
            >
              {showInstructions ? "Masquer les précisions" : "Voir les précisions"}
            </Button>
          )}
          {task.status === "claimed" && (
            <Button
              variant="accent"
              className="w-full sm:w-auto"
              disabled={locating || updateStatus.isPending}
              onClick={handleStart}
            >
              {locating ? "Localisation..." : updateStatus.isPending ? "Démarrage..." : "Démarrer"}
            </Button>
          )}
          {task.status === "in_progress" && !showNoteField && (
            <Button variant="accent" className="w-full sm:w-auto" onClick={() => setShowNoteField(true)}>
              Marquer complétée
            </Button>
          )}
          {task.status === "inspected" && (
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setShowInspection((v) => !v)}>
              {showInspection ? "Masquer l'inspection" : "Voir l'inspection"}
            </Button>
          )}
        </div>
      </div>

      {task.status === "claimed" && showStartField && needsOdometer && (
        <div className="mt-3 rounded-xl bg-flow-50/60 p-3">
          <label className="text-xs font-medium text-canvas-800">
            Compteur de la machine au démarrage — obligatoire
          </label>
          <input
            type="number"
            min={0}
            step="1"
            value={startOdo}
            onChange={(e) => setStartOdo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          />
          <p className="mt-1 text-[11px] text-canvas-600">
            Note aussi la photo du compteur (à venir). Reclique sur « Démarrer » pour confirmer.
          </p>
        </div>
      )}

      {task.status === "claimed" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-canvas-500">
          <IconMapPin className="h-3 w-3 shrink-0" />
          Ta position est notée au démarrage (assurance qualité). Autorise la
          localisation si possible.
        </p>
      )}

      {startNote && (
        <p className="mt-2 rounded-lg bg-linen-50 px-3 py-2 text-xs text-linen-800 ring-1 ring-linen-200">
          Démarré. {startNote} — sans effet sur le démarrage, c'est juste noté.
        </p>
      )}

      {startError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {startError}
        </p>
      )}

      {showInstructions && <InstructionsDetails task={task} />}

      {showNoteField && (
        <div className="mt-3 space-y-2 rounded-xl bg-flow-50/60 p-3">
          {needsMetric && (
            <div>
              <label className="text-xs font-medium text-canvas-800">
                {task.metricLabel ?? "Valeur réalisée"} — obligatoire
                {task.metricUnit ? ` (${task.metricUnit})` : ""}
                {task.metricTarget && (
                  <span className="text-canvas-600">
                    {" "}
                    · cible {Number(task.metricTarget)} {task.metricUnit ?? ""}
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
              />
              <p className="mt-1 text-[11px] text-canvas-600">
                Le paiement est au prorata : sous la cible, tu es payé proportionnellement.
              </p>
            </div>
          )}
          {needsUnits && (
            <div>
              <label className="text-xs font-medium text-canvas-800">
                {task.unitLabel ?? "Nombre réalisé"} — obligatoire
              </label>
              <input
                type="number"
                min={0}
                step="1"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
              />
              <p className="mt-1 text-[11px] text-canvas-600">
                Payé à l'unité{task.unitPrice ? ` : ${Number(task.unitPrice)} $ par unité` : ""}.
              </p>
            </div>
          )}
          {needsOdometer && (
            <div>
              <label className="text-xs font-medium text-canvas-800">
                Compteur de la machine à la fin — obligatoire
                {task.startOdometer != null && (
                  <span className="text-canvas-600"> · au départ : {Number(task.startOdometer)}</span>
                )}
              </label>
              <input
                type="number"
                min={0}
                step="1"
                value={endOdo}
                onChange={(e) => setEndOdo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
              />
              <p className="mt-1 text-[11px] text-canvas-600">
                {task.startOdometer != null && endOdo.trim() !== "" && Number(endOdo) > Number(task.startOdometer)
                  ? `Distance : ${(Number(endOdo) - Number(task.startOdometer)).toFixed(1)}`
                  : "L'app calcule la distance (fin − départ)."}
                {task.paymentMode === "metric_prorata" ? " — c'est le « réalisé » du prorata." : ""}
              </p>
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Remarque optionnelle (ex: il manquait du produit à vitres)"
            className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          />
          {completeError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
              {completeError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNoteField(false)}>
              Annuler
            </Button>
            <Button variant="accent" disabled={updateStatus.isPending} onClick={handleComplete}>
              {updateStatus.isPending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </div>
        </div>
      )}

      {task.status === "inspected" && task.workerNote && (
        <p className="mt-3 text-xs text-canvas-600">Ta remarque : {task.workerNote}</p>
      )}

      {showInspection && <InspectionDetails taskId={task.id} />}
    </div>
  );
}

const ACTIVE_STATUSES = ["claimed", "in_progress"];

export function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();
  const { data: claims } = useMyTaskClaims();
  const markSeen = useMarkDecisionsSeen();
  const [tab, setTab] = useState<"active" | "done">("active");

  useEffect(() => {
    markSeen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = (tasks ?? []).filter((t) =>
    tab === "active" ? ACTIVE_STATUSES.includes(t.status) : !ACTIVE_STATUSES.includes(t.status)
  );
  const doneCount = (tasks ?? []).filter((t) => !ACTIVE_STATUSES.includes(t.status)).length;

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Markettask</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Mes tâches</h1>
      <p className="mt-1 text-sm text-canvas-600">Le travail que tu as réclamé, et où tu en es.</p>

      <StreakBadge />

      <div className="mt-4 inline-flex rounded-lg border border-canvas-200 bg-white p-0.5 text-sm">
        {(["active", "done"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === k ? "bg-flow-600 text-white" : "text-canvas-600 hover:text-canvas-900"
            }`}
          >
            {k === "active" ? "À faire" : `Terminées${doneCount ? ` (${doneCount})` : ""}`}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {tasks && shown.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">
            {tab === "active" ? "Aucune tâche à faire pour l'instant." : "Aucune tâche terminée."}
          </p>
        </div>
      )}

      {shown.length > 0 && (
        <div className="mt-6 space-y-3">
          {shown.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {claims && claims.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-canvas-600">
            Historique de mes réclamations
          </h2>
          <div className="mt-3 space-y-2">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-canvas-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-canvas-900">
                    {claim.task?.description} <span className="text-canvas-600">({claim.task?.store?.name})</span>
                  </p>
                  <p className="text-xs text-canvas-600">{formatDate(claim.createdAt)}</p>
                  {claim.note && <p className="mt-1 text-xs italic text-canvas-600">« {claim.note} »</p>}
                  {claim.status === "rejected" && claim.decisionReason && (
                    <p className="mt-1 text-xs text-red-700">{claim.decisionReason}</p>
                  )}
                </div>
                {claim.status === "pending" && (
                  <span className="shrink-0 rounded-full bg-linen-100 px-2.5 py-0.5 text-xs font-medium text-linen-800">
                    En attente
                  </span>
                )}
                {claim.status === "approved" && (
                  <span className="shrink-0 rounded-full bg-flow-100 px-2.5 py-0.5 text-xs font-medium text-flow-800">
                    Approuvée
                  </span>
                )}
                {claim.status === "rejected" && (
                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Refusée
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
