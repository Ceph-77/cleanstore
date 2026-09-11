import { useState, type FormEvent } from "react";
import { AppLayout } from "../components/common/AppLayout";
import { Button } from "../components/common/Button";
import { Field } from "../components/common/Field";
import { Input } from "../components/common/Input";
import { RewardBadges } from "../components/engagement/RewardBadges";
import { useContributionsRegistry, useCreateContribution } from "../hooks/useContributions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", { dateStyle: "medium" });
}

export function RewardsPage() {
  const { data: registry } = useContributionsRegistry();
  const createContribution = useCreateContribution();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    await createContribution.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
    });
    setTitle("");
    setCategory("");
    setDescription("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Reconnaissance</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Rewards</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Tes badges, et un espace pour proposer une amélioration — l'horodatage de ta proposition sert de
        preuve d'antériorité.
      </p>

      <RewardBadges />

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-3 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5"
      >
        <h2 className="text-sm font-semibold text-canvas-900">Proposer une amélioration</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Titre">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Idée en une phrase" />
          </Field>
          <Field label="Catégorie (optionnel)">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex: outillage" />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          />
        </Field>
        <div className="flex items-center justify-end gap-3">
          {sent && <p className="text-xs font-medium text-green-700">✓ Envoyée</p>}
          <Button
            type="submit"
            variant="accent"
            disabled={createContribution.isPending || !title.trim() || !description.trim()}
          >
            {createContribution.isPending ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-canvas-900">Registre des contributions adoptées</h2>
        <div className="mt-3 space-y-2">
          {(!registry || registry.length === 0) && (
            <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-8 text-center text-sm text-canvas-600">
              Aucune contribution adoptée pour l'instant.
            </p>
          )}
          {registry?.map((c) => (
            <div key={c.id} className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
              <p className="text-sm font-medium text-canvas-900">{c.title}</p>
              <p className="mt-1 text-sm text-canvas-700">{c.description}</p>
              <p className="mt-2 text-xs text-canvas-500">
                {c.submittedBy?.fullName ?? c.submittedBy?.email ?? "Anonyme"} · {formatDate(c.updatedAt)}
                {c.pointsAwarded != null && <> · +{c.pointsAwarded} points</>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
