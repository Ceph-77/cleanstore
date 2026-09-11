/** Récupère un PDF avec le cookie de session et l'ouvre dans un nouvel onglet. */
async function openPdf(path: string): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error("Impossible de générer le document.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  // L'onglet ouvert a besoin de l'URL vivante — révoquer après coup, pas tout de suite.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const openWithdrawalReceipt = (withdrawalId: string) =>
  openPdf(`/documents/withdrawals/${withdrawalId}/receipt.pdf`);

export const openMonthlyStatement = (workerId: string, year: number, month: number) =>
  openPdf(`/documents/workers/${workerId}/statement.pdf?year=${year}&month=${month}`);

export const openIncidentReport = (incidentId: string) => openPdf(`/documents/incidents/${incidentId}/report.pdf`);
