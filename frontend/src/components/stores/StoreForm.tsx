import { useEffect, useState, type FormEvent } from "react";
import { Field } from "../common/Field";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import * as organizationsApi from "../../api/organizations";
import type { Organization, Store } from "../../types";

export interface StoreFormValues {
  name: string;
  banner: string;
  address: string;
  city: string;
  postalCode: string;
  storeManagerName: string;
  storeManagerPhone: string;
  storeManagerEmail: string;
  squareFootage: string;
  surfaceType: string;
  zones: string;
  cleaningFrequency: string;
  cleaningSchedule: string;
  contractStartDate: string;
  contractEndDate: string;
  contractRate: string;
  grandeCompagnieId: string;
  assignedSubcontractorId: string;
}

function toFormValues(store?: Store): StoreFormValues {
  return {
    name: store?.name ?? "",
    banner: store?.banner ?? "",
    address: store?.address ?? "",
    city: store?.city ?? "",
    postalCode: store?.postalCode ?? "",
    storeManagerName: store?.storeManagerName ?? "",
    storeManagerPhone: store?.storeManagerPhone ?? "",
    storeManagerEmail: store?.storeManagerEmail ?? "",
    squareFootage: store?.squareFootage ?? "",
    surfaceType: store?.surfaceType ?? "",
    zones: store?.zones?.join(", ") ?? "",
    cleaningFrequency: store?.cleaningFrequency ?? "",
    cleaningSchedule: store?.cleaningSchedule ?? "",
    contractStartDate: store?.contractStartDate?.slice(0, 10) ?? "",
    contractEndDate: store?.contractEndDate?.slice(0, 10) ?? "",
    contractRate: store?.contractRate ?? "",
    grandeCompagnieId: store?.grandeCompagnieId ?? "",
    assignedSubcontractorId: store?.assignedSubcontractorId ?? "",
  };
}

export function StoreForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Store;
  onSubmit: (values: StoreFormValues) => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<StoreFormValues>(toFormValues(initial));
  const [grandesCompagnies, setGrandesCompagnies] = useState<Organization[]>([]);
  const [sousTraitants, setSousTraitants] = useState<Organization[]>([]);

  useEffect(() => {
    organizationsApi.listOrganizations("grande_compagnie").then((r) => setGrandesCompagnies(r.organizations));
    organizationsApi.listOrganizations("sous_traitant").then((r) => setSousTraitants(r.organizations));
  }, []);

  function set<K extends keyof StoreFormValues>(key: K, value: StoreFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-canvas-900">
          <span className="h-2 w-2 rounded-full bg-flow-500" />
          Identité / contact
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom du magasin">
            <Input required value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Bannière">
            <Input value={values.banner} onChange={(e) => set("banner", e.target.value)} />
          </Field>
          <Field label="Adresse">
            <Input value={values.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Ville">
            <Input value={values.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Code postal">
            <Input value={values.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
          </Field>
          <Field label="Gérant du magasin">
            <Input value={values.storeManagerName} onChange={(e) => set("storeManagerName", e.target.value)} />
          </Field>
          <Field label="Téléphone du gérant">
            <Input value={values.storeManagerPhone} onChange={(e) => set("storeManagerPhone", e.target.value)} />
          </Field>
          <Field label="Courriel du gérant">
            <Input
              type="email"
              value={values.storeManagerEmail}
              onChange={(e) => set("storeManagerEmail", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-canvas-900">
          <span className="h-2 w-2 rounded-full bg-linen-400" />
          Caractéristiques physiques
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Superficie (pi²)">
            <Input
              type="number"
              step="0.01"
              value={values.squareFootage}
              onChange={(e) => set("squareFootage", e.target.value)}
            />
          </Field>
          <Field label="Type de surface">
            <Input
              value={values.surfaceType}
              onChange={(e) => set("surfaceType", e.target.value)}
              placeholder="ex: céramique, tapis"
            />
          </Field>
          <Field label="Zones (séparées par virgule)">
            <Input
              value={values.zones}
              onChange={(e) => set("zones", e.target.value)}
              placeholder="entrée, entrepôt, toilettes"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-canvas-900">
          <span className="h-2 w-2 rounded-full bg-flow-500" />
          Contrat / fréquence
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fréquence de nettoyage">
            <Input
              value={values.cleaningFrequency}
              onChange={(e) => set("cleaningFrequency", e.target.value)}
              placeholder="ex: 3x/semaine"
            />
          </Field>
          <Field label="Horaire">
            <Input value={values.cleaningSchedule} onChange={(e) => set("cleaningSchedule", e.target.value)} />
          </Field>
          <Field label="Début du contrat">
            <Input
              type="date"
              value={values.contractStartDate}
              onChange={(e) => set("contractStartDate", e.target.value)}
            />
          </Field>
          <Field label="Fin du contrat">
            <Input
              type="date"
              value={values.contractEndDate}
              onChange={(e) => set("contractEndDate", e.target.value)}
            />
          </Field>
          <Field label="Tarif du contrat ($)">
            <Input
              type="number"
              step="0.01"
              value={values.contractRate}
              onChange={(e) => set("contractRate", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-canvas-900">
          <span className="h-2 w-2 rounded-full bg-linen-400" />
          Assignation
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grande compagnie">
            <select
              className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
              value={values.grandeCompagnieId}
              onChange={(e) => set("grandeCompagnieId", e.target.value)}
            >
              <option value="">—</option>
              {grandesCompagnies.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sous-traitant assigné">
            <select
              className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
              value={values.assignedSubcontractorId}
              onChange={(e) => set("assignedSubcontractorId", e.target.value)}
            >
              <option value="">—</option>
              {sousTraitants.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer le magasin"}
        </Button>
      </div>
    </form>
  );
}
