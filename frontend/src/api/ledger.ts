import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";

export interface LedgerRow {
  id: string;
  type: string;
  amount: string;
  currency: string;
  partyAId: string | null;
  partyAName: string | null;
  partyBId: string | null;
  partyBName: string | null;
  taskId: string | null;
  task: { id: string; description: string; storeId: string } | null;
  reason: string | null;
  status: string;
  createdAt: string;
}

export interface LedgerSummary {
  passif: number;
  actif: number;
}

export interface LedgerFilters {
  type?: string | null;
  from?: string | null;
  to?: string | null;
}

export const listLedger = (filters: LedgerFilters, cursor?: string | null) =>
  apiClient.get<Page<LedgerRow>>(
    `/ledger${pageQuery(cursor, { type: filters.type, from: filters.from, to: filters.to })}`,
  );

export const getLedgerSummary = () => apiClient.get<LedgerSummary>("/ledger/summary");

/** Récupère le CSV avec le cookie de session et le remet au navigateur pour l'enregistrer. */
export async function downloadLedgerCsv(filters: LedgerFilters) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/ledger/export.csv${pageQuery(null, {
      type: filters.type,
      from: filters.from,
      to: filters.to,
    })}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("Export impossible.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grand-livre.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
