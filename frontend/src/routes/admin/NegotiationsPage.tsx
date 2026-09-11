import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { MarketTaskTabs } from "../../components/admin/MarketTaskTabs";
import { Button } from "../../components/common/Button";
import { LoadMore } from "../../components/common/LoadMore";
import {
  useNegotiationsAdmin,
  useAddAdminOffer,
  useAcceptNegotiation,
  useRejectNegotiation,
} from "../../hooks/useNegotiations";
import type { NegotiationStatus, TaskNegotiation } from "../../types";

const STATUS_FILTERS: { key: NegotiationStatus | "all"; label: string }[] = [
  { key: "open", label: "En cours" },
  { key: "accepted", label: "Acceptées" },
  { key: "rejected", label: "Refusées" },
  { key: "all", label: "Tout" },
];

const STATUS_STYLES: Record<NegotiationStatus, string> = {
  open: "bg-flow-100 text-flow-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-canvas-100 text-canvas-700",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

function NegotiationRow({ negotiation }: { negotiation: TaskNegotiation }) {
  const addOffer = useAddAdminOffer();
  const accept = useAcceptNegotiation();
  const reject = useRejectNegotiation();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lastOffer = negotiation.offers[negotiation.offers.length - 1];
  const isOpen = negotiation.status === "open";

  async function handleCounter() {
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Indique un montant valide.");
      return;
    }
    try {
      await addOffer.mutateAsync({ id: negotiation.id, amount: value, note: note.trim() || undefined });
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la contre-offre.");
    }
  }

  async function handleAccept() {
    setError(null);
    try {
      await accept.mutateAsync({
        id: negotiation.id,
        amount: amount ? Number(amount) : undefined,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'accepter.");
    }
  }

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-canvas-900">
            {negotiation.task.description}{" "}
            <span className="text-canvas-600">(prix actuel {Number(negotiation.task.price).toFixed(2)} $)</span>
          </p>
          <p className="mt-0.5 text-xs text-canvas-600">
            {negotiation.worker.fullName ?? negotiation.worker.email}
            {negotiation.clan && <> · au nom du clan {negotiation.clan.name}</>}
            {" · "}
            {formatDateTime(negotiation.createdAt)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[negotiation.status]}`}>
          {STATUS_FILTERS.find((f) => f.key === negotiation.status)?.label ?? negotiation.status}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-canvas-700">
        {negotiation.offers.map((o) => (
          <li key={o.id}>
            <span className="font-medium text-canvas-900">
              {o.authorRole === "worker" ? "Travailleur" : "Admin"} — {Number(o.amount).toFixed(2)} $
            </span>
            {o.note && <span className="text-canvas-600"> · {o.note}</span>}
          </li>
        ))}
      </ul>

      {isOpen && !rejecting && (
        <div className="mt-3 space-y-2 border-t border-canvas-200 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={lastOffer ? `dernière offre : ${Number(lastOffer.amount).toFixed(2)} $` : "Montant ($)"}
              className="flex-1 rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optionnel)"
              className="flex-1 rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{error}</p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" disabled={reject.isPending} onClick={() => setRejecting(true)}>
              Refuser
            </Button>
            <Button variant="secondary" disabled={addOffer.isPending || !amount} onClick={handleCounter}>
              {addOffer.isPending ? "..." : "Contre-offrir"}
            </Button>
            <Button variant="accent" disabled={accept.isPending} onClick={handleAccept}>
              {accept.isPending ? "..." : `Accepter${amount ? ` à ${amount} $` : lastOffer ? ` (${Number(lastOffer.amount).toFixed(2)} $)` : ""}`}
            </Button>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="mt-3 space-y-2 rounded-xl bg-red-50/60 p-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Raison du refus (optionnel)"
            className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              disabled={reject.isPending}
              onClick={async () => {
                await reject.mutateAsync({ id: negotiation.id, reason: reason.trim() || undefined });
                setRejecting(false);
              }}
            >
              {reject.isPending ? "..." : "Confirmer le refus"}
            </Button>
          </div>
        </div>
      )}

      <Link
        to={`/stores/${negotiation.task.storeId}`}
        className="mt-3 inline-block text-xs font-medium text-flow-700 hover:text-flow-900"
      >
        Voir le magasin →
      </Link>
    </div>
  );
}

export function NegotiationsPage() {
  const [filter, setFilter] = useState<NegotiationStatus | "all">("open");
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNegotiationsAdmin(filter);
  const negotiations = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Négociations</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Fils offre / contre-offre sur le prix des tâches négociables. Un accord fige le prix et attribue la
        tâche au travailleur (ou au clan).
      </p>

      <MarketTaskTabs active="negotiations" />

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && negotiations.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune négociation pour ce filtre.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {negotiations.map((n) => (
          <NegotiationRow key={n.id} negotiation={n} />
        ))}
      </div>

      <LoadMore hasNextPage={!!hasNextPage} isFetching={isFetchingNextPage} onClick={() => fetchNextPage()} />
    </AppLayout>
  );
}
