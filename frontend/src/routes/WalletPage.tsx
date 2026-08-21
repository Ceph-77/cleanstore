import { useState } from "react";
import { AppLayout } from "../components/common/AppLayout";
import { Button } from "../components/common/Button";
import { StatCard } from "../components/common/StatCard";
import { IconWallet } from "../components/common/icons";
import { useWalletBalance, useWalletHistory, useConnectOnboard, useWithdraw } from "../hooks/usePayments";
import { ApiError } from "../api/client";

function formatMoney(value: string | number) {
  return `${Number(value).toFixed(2)} $`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA");
}

const EARNING_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente (24h)", className: "bg-linen-100 text-linen-800" },
  disputed: { label: "Suspendu", className: "bg-red-50 text-red-700" },
  available: { label: "Disponible", className: "bg-flow-100 text-flow-800" },
  withdrawn: { label: "Retiré", className: "bg-canvas-100 text-canvas-700" },
};

const WITHDRAWAL_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "En cours", className: "bg-linen-100 text-linen-800" },
  paid: { label: "Payé", className: "bg-flow-100 text-flow-800" },
  failed: { label: "Échoué", className: "bg-red-50 text-red-700" },
};

export function WalletPage() {
  const { data: balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: history } = useWalletHistory();
  const connectOnboard = useConnectOnboard();
  const withdraw = useWithdraw();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);
    try {
      const { url } = await connectOnboard.mutateAsync();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion à Stripe");
    }
  }

  async function handleWithdraw() {
    setError(null);
    setMessage(null);
    try {
      await withdraw.mutateAsync();
      setMessage("Retrait demandé — l'argent s'en vient vers ton compte bancaire.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors du retrait");
    }
  }

  const hasAvailable = balance && Number(balance.available) > 0;

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Argent</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Portefeuille</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Ce que tu as gagné sur les tâches complétées, et ce que tu peux retirer maintenant.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="En attente (24h)"
          value={balanceLoading ? "…" : formatMoney(balance?.pending ?? 0)}
          icon={<IconWallet />}
          accent="linen"
        />
        <StatCard
          label="Disponible"
          value={balanceLoading ? "…" : formatMoney(balance?.available ?? 0)}
          icon={<IconWallet />}
          accent="flow"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-canvas-900">Compte bancaire</h2>
          <p className="mt-1 text-sm text-canvas-600">
            Connecte ton compte bancaire pour recevoir tes paiements. Géré directement par Stripe — nous ne voyons
            jamais tes coordonnées bancaires.
          </p>
        </div>
        <Button variant="secondary" onClick={handleConnect} disabled={connectOnboard.isPending}>
          {connectOnboard.isPending ? "Redirection..." : "Connecter mon compte bancaire"}
        </Button>
      </div>

      {(message || error) && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-red-50 text-red-700" : "bg-flow-50 text-flow-800"
          }`}
        >
          {error ?? message}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="accent" onClick={handleWithdraw} disabled={!hasAvailable || withdraw.isPending}>
          {withdraw.isPending ? "Retrait en cours..." : "Retirer le solde disponible"}
        </Button>
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-canvas-600">Gains par tâche</h2>
      <div className="mt-3 space-y-2">
        {history?.earnings.length === 0 && (
          <p className="text-sm text-canvas-600">Aucun gain pour l'instant.</p>
        )}
        {history?.earnings.map((earning) => {
          const status = EARNING_LABELS[earning.status];
          return (
            <div
              key={earning.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-canvas-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-canvas-900">
                  {earning.task?.description}{" "}
                  <span className="text-canvas-600">({earning.task?.store.name})</span>
                </p>
                <p className="text-xs text-canvas-600">{formatDate(earning.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-heading font-semibold text-canvas-900">
                  {formatMoney(earning.grossAmount)}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {history && history.withdrawals.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-canvas-600">Retraits</h2>
          <div className="mt-3 space-y-2">
            {history.withdrawals.map((w) => {
              const status = WITHDRAWAL_LABELS[w.status];
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-canvas-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-canvas-900">
                      {formatMoney(w.netAmount)}{" "}
                      <span className="text-xs text-canvas-600">
                        (brut {formatMoney(w.grossAmount)}, commission {formatMoney(w.commissionAmount)})
                      </span>
                    </p>
                    <p className="text-xs text-canvas-600">{formatDate(w.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
}
