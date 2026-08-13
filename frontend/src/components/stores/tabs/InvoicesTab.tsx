import { useState, type FormEvent } from "react";
import {
  useStoreInvoices,
  useCreateStoreInvoice,
  useUpdateStoreInvoice,
  useDeleteStoreInvoice,
} from "../../../hooks/useStoreInvoices";
import { Button } from "../../common/Button";
import { Field } from "../../common/Field";
import { Input } from "../../common/Input";
import { StatCard } from "../../common/StatCard";
import { IconWallet, IconTrash } from "../../common/icons";
import type { InvoiceStatus } from "../../../types";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Impayée",
  paid: "Payée",
  overdue: "En retard",
};

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  unpaid: "bg-canvas-100 text-canvas-700 ring-canvas-200",
  paid: "bg-flow-100 text-flow-800 ring-flow-200",
  overdue: "bg-red-50 text-red-700 ring-red-200",
};

export function InvoicesTab({ storeId }: { storeId: string }) {
  const { data: invoices } = useStoreInvoices(storeId);
  const createInvoice = useCreateStoreInvoice(storeId);
  const updateInvoice = useUpdateStoreInvoice(storeId);
  const deleteInvoice = useDeleteStoreInvoice(storeId);

  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState({ label: "", amount: "", dueDate: "" });

  const totalUnpaid = (invoices ?? [])
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = (invoices ?? []).filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount), 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createInvoice.mutateAsync({ ...values, dueDate: values.dueDate || undefined });
    setValues({ label: "", amount: "", dueDate: "" });
    setShowForm(false);
  }

  async function handleStatusChange(id: string, status: InvoiceStatus) {
    await updateInvoice.mutateAsync({ id, data: { status } });
  }

  async function handleDelete(id: string, label: string) {
    if (confirm(`Supprimer la facture "${label}" ?`)) {
      await deleteInvoice.mutateAsync(id);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-canvas-900">Finances</h2>
        <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
          + Ajouter une facture
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Impayé" value={`${totalUnpaid.toFixed(2)} $`} icon={<IconWallet />} accent="linen" />
        <StatCard label="Payé à ce jour" value={`${totalPaid.toFixed(2)} $`} icon={<IconWallet />} accent="flow" />
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
        >
          <div className="grid grid-cols-3 gap-4">
            <Field label="Libellé">
              <Input
                required
                value={values.label}
                onChange={(e) => setValues({ ...values, label: e.target.value })}
                placeholder="ex: Facture Août 2026"
              />
            </Field>
            <Field label="Montant ($)">
              <Input
                required
                type="number"
                step="0.01"
                value={values.amount}
                onChange={(e) => setValues({ ...values, amount: e.target.value })}
              />
            </Field>
            <Field label="Échéance">
              <Input
                type="date"
                value={values.dueDate}
                onChange={(e) => setValues({ ...values, dueDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
        <div className="p-5">
          {invoices && invoices.length === 0 && (
            <p className="py-4 text-sm text-canvas-600">Aucune facture pour ce magasin.</p>
          )}
          {invoices && invoices.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                  <th className="py-2 pr-3">Libellé</th>
                  <th className="py-2 pr-3">Montant</th>
                  <th className="py-2 pr-3">Échéance</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-canvas-100 last:border-0">
                    <td className="py-3 pr-3 text-canvas-900">{invoice.label}</td>
                    <td className="py-3 pr-3 font-medium text-canvas-900">{Number(invoice.amount).toFixed(2)} $</td>
                    <td className="py-3 pr-3 text-canvas-700">{invoice.dueDate ? invoice.dueDate.slice(0, 10) : "—"}</td>
                    <td className="py-3 pr-3">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value as InvoiceStatus)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[invoice.status]}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDelete(invoice.id, invoice.label)}
                        className="text-canvas-600 hover:text-red-600"
                        aria-label="Supprimer"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
