import { useState, type FormEvent } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { Field } from "../../components/common/Field";
import { Input } from "../../components/common/Input";
import { ApiError } from "../../api/client";
import {
  useTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeactivateTaskTemplate,
} from "../../hooks/useTaskTemplates";
import type { PaymentMode, TaskTemplate } from "../../types";
import type { TemplateInput } from "../../api/taskTemplates";

type FormState = {
  name: string;
  description: string;
  taskType: string;
  estimatedDurationMinutes: string;
  defaultPrice: string;
  isNegotiable: boolean;
  isRecurringDefault: boolean;
  isActive: boolean;
  expectedResultText: string;
  howToText: string;
  requiredEquipment: string;
  metricLabel: string;
  metricUnit: string;
  defaultMetricTarget: string;
  paymentMode: PaymentMode;
  hourlyRate: string;
  hourlyCapMinutes: string;
  unitPrice: string;
  unitLabel: string;
  steps: string[];
};

const EMPTY: FormState = {
  name: "",
  description: "",
  taskType: "",
  estimatedDurationMinutes: "",
  defaultPrice: "",
  isNegotiable: false,
  isRecurringDefault: false,
  isActive: true,
  expectedResultText: "",
  howToText: "",
  requiredEquipment: "",
  metricLabel: "",
  metricUnit: "",
  defaultMetricTarget: "",
  paymentMode: "fixed",
  hourlyRate: "",
  hourlyCapMinutes: "",
  unitPrice: "",
  unitLabel: "",
  steps: [],
};

const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  fixed: "Prix fixe (forfait)",
  hourly: "À l'heure (taux × temps réel)",
  per_unit: "À l'unité (prix unitaire × nombre réalisé)",
  metric_prorata: "Au prorata d'une métrique (prix × réalisé ÷ cible)",
};

function toForm(t: TaskTemplate): FormState {
  return {
    name: t.name,
    description: t.description,
    taskType: t.taskType ?? "",
    estimatedDurationMinutes: t.estimatedDurationMinutes?.toString() ?? "",
    defaultPrice: t.defaultPrice ?? "",
    isNegotiable: t.isNegotiable,
    isRecurringDefault: t.isRecurringDefault,
    isActive: t.isActive,
    expectedResultText: t.expectedResultText ?? "",
    howToText: t.howToText ?? "",
    requiredEquipment: t.requiredEquipment.join(", "),
    metricLabel: t.metricLabel ?? "",
    metricUnit: t.metricUnit ?? "",
    defaultMetricTarget: t.defaultMetricTarget ?? "",
    paymentMode: t.paymentMode ?? "fixed",
    hourlyRate: t.hourlyRate ?? "",
    hourlyCapMinutes: t.hourlyCapMinutes?.toString() ?? "",
    unitPrice: t.unitPrice ?? "",
    unitLabel: t.unitLabel ?? "",
    steps: t.steps.map((s) => s.text),
  };
}

function toPayload(f: FormState): TemplateInput {
  const num = (s: string) => (s.trim() === "" ? null : Number(s));
  return {
    name: f.name.trim(),
    description: f.description.trim(),
    taskType: f.taskType.trim() || undefined,
    estimatedDurationMinutes: num(f.estimatedDurationMinutes),
    defaultPrice: num(f.defaultPrice),
    isNegotiable: f.isNegotiable,
    isRecurringDefault: f.isRecurringDefault,
    isActive: f.isActive,
    expectedResultText: f.expectedResultText.trim() || undefined,
    howToText: f.howToText.trim() || undefined,
    requiredEquipment: f.requiredEquipment
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    metricLabel: f.paymentMode === "metric_prorata" ? f.metricLabel.trim() || null : null,
    metricUnit: f.paymentMode === "metric_prorata" ? f.metricUnit.trim() || null : null,
    defaultMetricTarget: f.paymentMode === "metric_prorata" ? num(f.defaultMetricTarget) : null,
    paymentMode: f.paymentMode,
    hourlyRate: f.paymentMode === "hourly" ? num(f.hourlyRate) : null,
    hourlyCapMinutes: f.paymentMode === "hourly" ? num(f.hourlyCapMinutes) : null,
    unitPrice: f.paymentMode === "per_unit" ? num(f.unitPrice) : null,
    unitLabel: f.paymentMode === "per_unit" ? f.unitLabel.trim() || null : null,
    steps: f.steps.map((s) => s.trim()).filter(Boolean),
  };
}

const inputCls =
  "w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200";

function TemplateForm({
  initial,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  initial: FormState;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (payload: TemplateInput) => void;
}) {
  const [f, setF] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(toPayload(f));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <Input required value={f.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Type de tâche">
          <Input value={f.taskType} onChange={(e) => set("taskType", e.target.value)} />
        </Field>
      </div>
      <Field label="Description">
        <Input required value={f.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Durée estimée (min)">
          <Input
            type="number"
            min={1}
            value={f.estimatedDurationMinutes}
            onChange={(e) => set("estimatedDurationMinutes", e.target.value)}
          />
        </Field>
        <Field label="Prix indicatif ($) — laisser vide si variable">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={f.defaultPrice}
            onChange={(e) => set("defaultPrice", e.target.value)}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-canvas-800">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={f.isRecurringDefault}
            onChange={(e) => set("isRecurringDefault", e.target.checked)}
          />
          Récurrente par défaut
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={f.isNegotiable}
            onChange={(e) => set("isNegotiable", e.target.checked)}
          />
          Prix négociable
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Actif
        </label>
      </div>

      <Field label="Résultat attendu">
        <textarea
          rows={2}
          className={inputCls}
          value={f.expectedResultText}
          onChange={(e) => set("expectedResultText", e.target.value)}
        />
      </Field>
      <Field label="Précisions (visible après réclamation)">
        <textarea
          rows={2}
          className={inputCls}
          value={f.howToText}
          onChange={(e) => set("howToText", e.target.value)}
        />
      </Field>
      <Field label="Équipement à prévoir (séparé par virgule)">
        <Input
          value={f.requiredEquipment}
          onChange={(e) => set("requiredEquipment", e.target.value)}
        />
      </Field>

      <fieldset className="rounded-xl border border-canvas-200 bg-white p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-canvas-600">
          Mode de paiement
        </legend>
        <Field label="Comment cette tâche est payée">
          <select
            className={inputCls}
            value={f.paymentMode}
            onChange={(e) => set("paymentMode", e.target.value as PaymentMode)}
          >
            {(Object.keys(PAYMENT_MODE_LABELS) as PaymentMode[]).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>

        {f.paymentMode === "fixed" && (
          <p className="mt-2 text-xs text-canvas-600">
            Le montant payé est le « Prix indicatif » ci-dessus.
          </p>
        )}

        {f.paymentMode === "hourly" && (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Taux horaire ($/h)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={f.hourlyRate}
                onChange={(e) => set("hourlyRate", e.target.value)}
              />
            </Field>
            <Field label="Plafond d'heures (minutes) — optionnel">
              <Input
                type="number"
                min={0}
                step="1"
                placeholder="ex. 120"
                value={f.hourlyCapMinutes}
                onChange={(e) => set("hourlyCapMinutes", e.target.value)}
              />
            </Field>
          </div>
        )}

        {f.paymentMode === "per_unit" && (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Prix unitaire ($)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={f.unitPrice}
                onChange={(e) => set("unitPrice", e.target.value)}
              />
            </Field>
            <Field label="Libellé de l'unité">
              <Input
                placeholder="ex. vitres, m²"
                value={f.unitLabel}
                onChange={(e) => set("unitLabel", e.target.value)}
              />
            </Field>
          </div>
        )}

        {f.paymentMode === "metric_prorata" && (
          <>
            <p className="mb-2 mt-2 text-xs text-canvas-600">
              Le travailleur saisit sa valeur en complétant ; le paiement est prix × min(1, réalisé ÷
              cible).
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Libellé">
                <Input
                  placeholder="Distance polie"
                  value={f.metricLabel}
                  onChange={(e) => set("metricLabel", e.target.value)}
                />
              </Field>
              <Field label="Unité">
                <Input
                  placeholder="km"
                  value={f.metricUnit}
                  onChange={(e) => set("metricUnit", e.target.value)}
                />
              </Field>
              <Field label="Cible par défaut">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="1.6"
                  value={f.defaultMetricTarget}
                  onChange={(e) => set("defaultMetricTarget", e.target.value)}
                />
              </Field>
            </div>
          </>
        )}
      </fieldset>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-canvas-600">
          Points de contrôle
        </p>
        <div className="space-y-2">
          {f.steps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={step}
                onChange={(e) =>
                  set(
                    "steps",
                    f.steps.map((s, j) => (j === i ? e.target.value : s))
                  )
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => set("steps", f.steps.filter((_, j) => j !== i))}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={() => set("steps", [...f.steps, ""])}
        >
          + Point de contrôle
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

export function TaskTemplatesPage() {
  const { data: templates, isLoading } = useTaskTemplates(true);
  const createT = useCreateTaskTemplate();
  const updateT = useUpdateTaskTemplate();
  const deactivateT = useDeactivateTaskTemplate();

  const [mode, setMode] = useState<{ kind: "none" } | { kind: "new" } | { kind: "edit"; id: string }>({
    kind: "none",
  });
  const [error, setError] = useState<string | null>(null);

  const editing = mode.kind === "edit" ? templates?.find((t) => t.id === mode.id) : undefined;

  async function submit(payload: TemplateInput) {
    setError(null);
    try {
      if (mode.kind === "edit") await updateT.mutateAsync({ id: mode.id, data: payload });
      else await createT.mutateAsync(payload);
      setMode({ kind: "none" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">
            Modèles de tâches
          </h1>
          <p className="mt-1 text-sm text-canvas-600">
            Définis une tâche une fois, applique-la ensuite à n'importe quel magasin.
          </p>
        </div>
        {mode.kind === "none" && (
          <Button
            variant="accent"
            onClick={() => {
              setError(null);
              setMode({ kind: "new" });
            }}
          >
            + Nouveau modèle
          </Button>
        )}
      </div>

      {mode.kind === "new" && (
        <div className="mt-4">
          <TemplateForm
            initial={EMPTY}
            submitting={createT.isPending}
            error={error}
            onCancel={() => setMode({ kind: "none" })}
            onSubmit={submit}
          />
        </div>
      )}
      {mode.kind === "edit" && editing && (
        <div className="mt-4">
          <TemplateForm
            key={editing.id}
            initial={toForm(editing)}
            submitting={updateT.isPending}
            error={error}
            onCancel={() => setMode({ kind: "none" })}
            onSubmit={submit}
          />
        </div>
      )}

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      <div className="mt-6 space-y-3">
        {templates?.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5 ${
              t.isActive ? "" : "opacity-60"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-canvas-900">
                  {t.name}
                  {!t.isActive && (
                    <span className="ml-2 rounded-full bg-canvas-200 px-2 py-0.5 text-[11px] font-medium text-canvas-700">
                      Inactif
                    </span>
                  )}
                  {t.isRecurringDefault && (
                    <span className="ml-2 rounded-full bg-linen-100 px-2 py-0.5 text-[11px] font-medium text-linen-800">
                      Récurrente
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-canvas-600">{t.description}</p>
                <p className="mt-1 text-xs text-canvas-600">
                  {t.estimatedDurationMinutes ? `~${t.estimatedDurationMinutes} min · ` : ""}
                  {t.steps.length} point{t.steps.length === 1 ? "" : "s"} de contrôle
                  {t.metricLabel && (
                    <>
                      {" · métrique : "}
                      <span className="font-medium text-canvas-800">
                        {t.metricLabel}
                        {t.defaultMetricTarget ? ` (cible ${t.defaultMetricTarget} ${t.metricUnit ?? ""})` : ""}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" onClick={() => setMode({ kind: "edit", id: t.id })}>
                  Éditer
                </Button>
                {t.isActive && (
                  <Button
                    variant="danger"
                    disabled={deactivateT.isPending}
                    onClick={() => deactivateT.mutate(t.id)}
                  >
                    Désactiver
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
