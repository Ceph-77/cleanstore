import { useEffect, useState, type FormEvent } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { Field } from "../../components/common/Field";
import { Input } from "../../components/common/Input";
import { useCommissionRate, useUpdateCommissionRate } from "../../hooks/usePayments";
import { ApiError } from "../../api/client";

export function SettingsPage() {
  const { data: commissionRate, isLoading } = useCommissionRate();
  const updateCommissionRate = useUpdateCommissionRate();
  const [rate, setRate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (commissionRate !== undefined) {
      setRate(commissionRate);
    }
  }, [commissionRate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await updateCommissionRate.mutateAsync(Number(rate));
      setMessage("Taux de commission mis à jour.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour");
    }
  }

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Administration</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Réglages</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-md space-y-4 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5"
      >
        <h2 className="text-sm font-semibold text-canvas-900">Commission KLEAN'STOR</h2>
        <p className="text-sm text-canvas-600">
          Pourcentage prélevé sur le solde d'un travailleur au moment où il retire son argent.
        </p>
        <Field label="Taux de commission (%)">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            disabled={isLoading}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
        {message && <p className="rounded-lg bg-flow-50 px-3 py-2 text-sm text-flow-800">{message}</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={updateCommissionRate.isPending}>
            {updateCommissionRate.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
