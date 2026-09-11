import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { Field } from "../../components/common/Field";
import { Input } from "../../components/common/Input";
import { IconChat } from "../../components/common/icons";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  useMyClans,
  useClanInvites,
  useCreateClan,
  useJoinClan,
  useAcceptClanInvite,
  useInviteToClan,
  useLeaveClan,
  useRemoveClanMember,
} from "../../hooks/useClans";
import { useClaimableTasks, useMyShareClaims, useCreateShareClaim } from "../../hooks/useClanShares";
import type { Clan } from "../../types";
import type { ClaimableTask } from "../../api/clanShares";

const SHARE_PERCENTS = [25, 50, 75, 85] as const;

function ClaimableTaskRow({ task }: { task: ClaimableTask }) {
  const { data: myClaims } = useMyShareClaims();
  const createClaim = useCreateShareClaim(task.id);
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState<number>(25);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const existing = myClaims?.find((c) => c.taskId === task.id);

  async function handleSubmit() {
    setError(null);
    try {
      await createClaim.mutateAsync({ percent, note: note.trim() || undefined });
      setOpen(false);
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la réclamation.");
    }
  }

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-canvas-900">{task.description}</p>
          <p className="mt-0.5 text-xs text-canvas-600">
            {task.store?.name} · réservée par {task.assignedTo?.fullName ?? task.assignedTo?.email} ·{" "}
            {Number(task.price).toFixed(2)} $
          </p>
        </div>
        {existing ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              existing.status === "pending"
                ? "bg-linen-100 text-linen-800"
                : existing.status === "accepted" || existing.status === "inspector_awarded"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {existing.status === "pending"
              ? `En attente (${existing.percent}%)`
              : existing.status === "refused"
                ? "Refusée"
                : `Acceptée (${existing.percent}%)`}
          </span>
        ) : (
          !open && (
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Réclamer une part
            </Button>
          )
        )}
      </div>
      {open && !existing && (
        <div className="mt-3 space-y-2 border-t border-canvas-200 pt-3">
          <div className="flex flex-wrap gap-2">
            {SHARE_PERCENTS.map((p) => (
              <button
                key={p}
                onClick={() => setPercent(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  percent === p ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ce que tu as fait (optionnel)"
            className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="accent" disabled={createClaim.isPending} onClick={handleSubmit}>
              {createClaim.isPending ? "Envoi..." : "Envoyer la réclamation"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClanCard({ clan, meId }: { clan: Clan; meId: string }) {
  const isFounder = clan.founderId === meId;
  const invite = useInviteToClan();
  const leave = useLeaveClan();
  const removeMember = useRemoveClanMember();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-heading font-semibold text-canvas-900">
            {clan.name}
            {isFounder && (
              <span className="ml-2 rounded-full bg-linen-100 px-2 py-0.5 text-[11px] font-medium text-linen-800">
                Fondateur
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-canvas-600">
            Code d'invitation : <span className="font-mono font-semibold text-canvas-800">{clan.inviteCode}</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to={`/messages?clan=${clan.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-canvas-300 px-3 py-2 text-sm font-medium text-canvas-700 hover:bg-canvas-50"
          >
            <IconChat className="h-4 w-4" /> Discuter
          </Link>
          <Button
            variant="danger"
            disabled={leave.isPending}
            onClick={() => {
              if (confirm(`Quitter le clan « ${clan.name} » ? Tu gardes tout ton acquis.`)) {
                leave.mutate(clan.id);
              }
            }}
          >
            Quitter
          </Button>
        </div>
      </div>

      <ul className="mt-3 space-y-1">
        {clan.members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between text-sm text-canvas-800">
            <span>
              {m.user.fullName ?? m.user.email}
              {m.userId === clan.founderId && <span className="text-canvas-500"> · fondateur</span>}
              {m.userId === meId && <span className="text-canvas-500"> · moi</span>}
            </span>
            {isFounder && m.userId !== clan.founderId && (
              <button
                className="text-xs font-medium text-red-700 hover:underline"
                onClick={() => removeMember.mutate({ clanId: clan.id, userId: m.userId })}
              >
                Retirer
              </button>
            )}
          </li>
        ))}
      </ul>

      {isFounder && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            try {
              await invite.mutateAsync({ clanId: clan.id, email });
              setEmail("");
            } catch (e2) {
              setErr(e2 instanceof ApiError ? e2.message : "Invitation impossible.");
            }
          }}
        >
          <Field label="Inviter par courriel">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coequipier@exemple.com"
            />
          </Field>
          <Button type="submit" variant="secondary" disabled={invite.isPending || !email}>
            Inviter
          </Button>
          {err && <p className="w-full text-xs font-medium text-red-700">{err}</p>}
        </form>
      )}
    </div>
  );
}

export function ClansPage() {
  const { user } = useAuth();
  const { data: clans, isLoading } = useMyClans();
  const { data: invites } = useClanInvites();
  const create = useCreateClan();
  const join = useJoinClan();
  const accept = useAcceptClanInvite();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Mes clans</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Regroupe-toi avec d'autres travailleurs pour réserver des tâches plus grosses. Tu peux
        appartenir à plusieurs clans.
      </p>

      {err && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {err}
        </p>
      )}

      {!!invites?.length && (
        <div className="mt-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-4">
          <p className="text-sm font-medium text-canvas-800">Invitations en attente</p>
          <ul className="mt-2 space-y-2">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between text-sm">
                <span>
                  Clan <span className="font-medium">{inv.clan.name}</span>
                </span>
                <Button variant="accent" disabled={accept.isPending} onClick={() => accept.mutate(inv.id)}>
                  Rejoindre
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <form
          className="rounded-2xl border border-canvas-200 bg-white p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            try {
              await create.mutateAsync(name);
              setName("");
            } catch (e2) {
              setErr(e2 instanceof ApiError ? e2.message : "Création impossible.");
            }
          }}
        >
          <p className="mb-2 text-sm font-medium text-canvas-800">Créer un clan</p>
          <div className="flex items-end gap-2">
            <Field label="Nom du clan">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Les Éclairs" />
            </Field>
            <Button type="submit" variant="accent" disabled={create.isPending || name.trim().length < 2}>
              Créer
            </Button>
          </div>
        </form>

        <form
          className="rounded-2xl border border-canvas-200 bg-white p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            try {
              await join.mutateAsync(code);
              setCode("");
            } catch (e2) {
              setErr(e2 instanceof ApiError ? e2.message : "Code invalide.");
            }
          }}
        >
          <p className="mb-2 text-sm font-medium text-canvas-800">Rejoindre avec un code</p>
          <div className="flex items-end gap-2">
            <Field label="Code d'invitation">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC234"
                className="font-mono uppercase"
              />
            </Field>
            <Button type="submit" variant="accent" disabled={join.isPending || code.trim().length < 4}>
              Rejoindre
            </Button>
          </div>
        </form>
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}
      {!isLoading && !clans?.length && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-12 text-center text-sm text-canvas-600">
          Tu n'es dans aucun clan pour l'instant.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {clans?.map((c) => (
          <ClanCard key={c.id} clan={c} meId={user?.id ?? ""} />
        ))}
      </div>

      <ClaimableTasksSection />
    </AppLayout>
  );
}

function ClaimableTasksSection() {
  const { data: tasks, isLoading } = useClaimableTasks();
  if (isLoading || !tasks || tasks.length === 0) return null;
  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-canvas-600">
        Tâches de mon clan à réclamer
      </h2>
      <p className="mt-1 text-xs text-canvas-600">
        Tu as aidé sur une tâche réservée par un coéquipier ? Réclame ta part — le réservateur décide.
      </p>
      <div className="mt-3 space-y-3">
        {tasks.map((t) => (
          <ClaimableTaskRow key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}
