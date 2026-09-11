import { useState, type FormEvent } from "react";
import {
  useInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeactivateInventoryItem,
  useRestockInventoryItem,
  useInventoryMovements,
} from "../../../hooks/useInventory";
import { Button } from "../../common/Button";
import { Field } from "../../common/Field";
import { Input } from "../../common/Input";
import { StatCard } from "../../common/StatCard";
import { IconInventory, IconTrash } from "../../common/icons";
import type { InventoryItem, InventoryKind } from "../../../types";

const KIND_LABELS: Record<InventoryKind, string> = {
  consommable: "Consommable",
  produit_chimique: "Produit chimique",
  gaz: "Gaz (propane...)",
  machine: "Machine",
};

const emptyValues = {
  kind: "consommable" as InventoryKind,
  name: "",
  unit: "",
  quantity: "0",
  lowThreshold: "",
  expiryDate: "",
  odometer: "",
  condition: "",
};

function isLow(item: InventoryItem): boolean {
  if (item.lowThreshold == null) return false;
  return Number(item.quantity) <= Number(item.lowThreshold);
}

function isExpiringSoon(item: InventoryItem): boolean {
  if (item.kind !== "produit_chimique" || !item.expiryDate) return false;
  const days = (new Date(item.expiryDate).getTime() - Date.now()) / 86_400_000;
  return days <= 14;
}

export function InventoryTab({ storeId }: { storeId: string }) {
  const { data: items } = useInventory(storeId);
  const createItem = useCreateInventoryItem(storeId);
  const updateItem = useUpdateInventoryItem(storeId);
  const deactivateItem = useDeactivateInventoryItem(storeId);
  const restockItem = useRestockInventoryItem(storeId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState(emptyValues);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [movementsFor, setMovementsFor] = useState<string | null>(null);
  const { data: movements } = useInventoryMovements(movementsFor);

  const active = (items ?? []).filter((i) => i.isActive);
  const lowCount = active.filter(isLow).length;
  const expiringCount = active.filter(isExpiringSoon).length;

  function startCreate() {
    setEditingId(null);
    setValues(emptyValues);
    setShowForm(true);
  }

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setValues({
      kind: item.kind,
      name: item.name,
      unit: item.unit ?? "",
      quantity: item.quantity,
      lowThreshold: item.lowThreshold ?? "",
      expiryDate: item.expiryDate?.slice(0, 10) ?? "",
      odometer: item.odometer ?? "",
      condition: item.condition ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      kind: values.kind,
      name: values.name,
      unit: values.unit || null,
      lowThreshold: values.lowThreshold === "" ? null : Number(values.lowThreshold),
      expiryDate: values.expiryDate || null,
      odometer: values.odometer === "" ? null : Number(values.odometer),
      condition: values.condition || null,
    };
    if (editingId) {
      await updateItem.mutateAsync({ id: editingId, data: payload });
    } else {
      await createItem.mutateAsync({ ...payload, quantity: Number(values.quantity) || 0 });
    }
    setValues(emptyValues);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleDeactivate(item: InventoryItem) {
    if (confirm(`Retirer "${item.name}" de l'inventaire actif ?`)) {
      await deactivateItem.mutateAsync(item.id);
    }
  }

  async function handleRestock(id: string) {
    const qty = Number(restockQty);
    if (!Number.isFinite(qty) || qty === 0) return;
    await restockItem.mutateAsync({ id, qty });
    setRestockingId(null);
    setRestockQty("");
  }

  const saving = createItem.isPending || updateItem.isPending;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-canvas-900">Équipements &amp; stock</h2>
        <Button variant="accent" onClick={startCreate}>
          + Ajouter un article
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Stock bas" value={String(lowCount)} icon={<IconInventory />} accent="linen" />
        <StatCard
          label="Péremption proche (≤14j)"
          value={String(expiringCount)}
          icon={<IconInventory />}
          accent="flow"
        />
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Type">
              <select
                className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                value={values.kind}
                onChange={(e) => setValues({ ...values, kind: e.target.value as InventoryKind })}
              >
                {Object.entries(KIND_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nom">
              <Input
                required
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                placeholder="ex: Nettoyant vitres"
              />
            </Field>
            <Field label="Unité">
              <Input
                value={values.unit}
                onChange={(e) => setValues({ ...values, unit: e.target.value })}
                placeholder="ex: L, kg, un."
              />
            </Field>
            {!editingId && (
              <Field label="Quantité initiale">
                <Input
                  type="number"
                  step="0.01"
                  value={values.quantity}
                  onChange={(e) => setValues({ ...values, quantity: e.target.value })}
                />
              </Field>
            )}
            <Field label="Seuil bas">
              <Input
                type="number"
                step="0.01"
                value={values.lowThreshold}
                onChange={(e) => setValues({ ...values, lowThreshold: e.target.value })}
                placeholder="alerte sous ce seuil"
              />
            </Field>
            {values.kind === "produit_chimique" && (
              <Field label="Date de péremption">
                <Input
                  type="date"
                  value={values.expiryDate}
                  onChange={(e) => setValues({ ...values, expiryDate: e.target.value })}
                />
              </Field>
            )}
            {values.kind === "machine" && (
              <>
                <Field label="Compteur (odomètre)">
                  <Input
                    type="number"
                    step="0.01"
                    value={values.odometer}
                    onChange={(e) => setValues({ ...values, odometer: e.target.value })}
                  />
                </Field>
                <Field label="État">
                  <Input
                    value={values.condition}
                    onChange={(e) => setValues({ ...values, condition: e.target.value })}
                    placeholder="ex: bon, à réviser"
                  />
                </Field>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
        <div className="overflow-x-auto p-5">
          {active.length === 0 && <p className="py-4 text-sm text-canvas-600">Aucun article dans l'inventaire.</p>}
          {active.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                  <th className="py-2 pr-3">Nom</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Quantité</th>
                  <th className="py-2 pr-3">Péremption</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {active.map((item) => (
                  <>
                    <tr key={item.id} className="border-b border-canvas-100 last:border-0">
                      <td className="py-3 pr-3 text-canvas-900">{item.name}</td>
                      <td className="py-3 pr-3 text-canvas-700">{KIND_LABELS[item.kind]}</td>
                      <td className="py-3 pr-3 font-medium text-canvas-900">
                        {Number(item.quantity).toFixed(2)} {item.unit ?? ""}
                        {isLow(item) && (
                          <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                            Bas
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-canvas-700">
                        {item.expiryDate ? item.expiryDate.slice(0, 10) : "—"}
                        {isExpiringSoon(item) && (
                          <span className="ml-2 rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800 ring-1 ring-inset ring-linen-200">
                            Bientôt
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-3 text-xs font-medium">
                          <button
                            onClick={() => setRestockingId(restockingId === item.id ? null : item.id)}
                            className="text-flow-700 hover:text-flow-900"
                          >
                            Réapprovisionner
                          </button>
                          <button
                            onClick={() => setMovementsFor(movementsFor === item.id ? null : item.id)}
                            className="text-canvas-600 hover:text-canvas-900"
                          >
                            Historique
                          </button>
                          <button onClick={() => startEdit(item)} className="text-flow-700 hover:text-flow-900">
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeactivate(item)}
                            className="text-canvas-600 hover:text-red-600"
                            aria-label="Retirer"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {restockingId === item.id && (
                      <tr className="border-b border-canvas-100 bg-canvas-50">
                        <td colSpan={5} className="py-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={restockQty}
                              onChange={(e) => setRestockQty(e.target.value)}
                              placeholder="quantité (+ ajoute, - retire)"
                              className="max-w-xs"
                            />
                            <Button variant="accent" onClick={() => handleRestock(item.id)}>
                              Confirmer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {movementsFor === item.id && (
                      <tr className="border-b border-canvas-100 bg-canvas-50">
                        <td colSpan={5} className="py-3">
                          {!movements || movements.length === 0 ? (
                            <p className="text-xs text-canvas-600">Aucun mouvement enregistré.</p>
                          ) : (
                            <ul className="space-y-1 text-xs text-canvas-700">
                              {movements.map((m) => (
                                <li key={m.id}>
                                  {new Date(m.createdAt).toLocaleString("fr-CA")} — {Number(m.delta) > 0 ? "+" : ""}
                                  {Number(m.delta)} ({m.reason})
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
