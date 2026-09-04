import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { Field } from "../../components/common/Field";
import { Input } from "../../components/common/Input";
import { IconUser } from "../../components/common/icons";
import { useUsers, useCreateUser, useSetUserActive, useDeleteUser } from "../../hooks/useUsers";
import * as organizationsApi from "../../api/organizations";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { Organization, RoleKey } from "../../types";

const IMPERSONATABLE_ROLES: RoleKey[] = ["travailleur", "sous_traitant"];

function homeForImpersonatedRole(role: RoleKey) {
  return role === "travailleur" ? "/markettask/tasks" : "/markettask/stores";
}

const initialValues = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  role: "travailleur" as "sous_traitant" | "travailleur",
  organizationId: "",
};

export function UsersPage() {
  const { data: users } = useUsers();
  const createUser = useCreateUser();
  const setUserActive = useSetUserActive();
  const deleteUser = useDeleteUser();
  const { impersonate, user: authUser } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [sousTraitants, setSousTraitants] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  async function handleDelete(id: string, label: string) {
    setRowError(null);
    if (!confirm(`Supprimer définitivement « ${label} » ? Cette action est irréversible.`)) return;
    try {
      await deleteUser.mutateAsync(id);
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Suppression impossible.");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setRowError(null);
    try {
      await setUserActive.mutateAsync({ id, isActive });
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Modification impossible.");
    }
  }

  async function handleImpersonate(userId: string, role: RoleKey) {
    setImpersonatingId(userId);
    try {
      await impersonate(userId);
      navigate(homeForImpersonatedRole(role));
    } finally {
      setImpersonatingId(null);
    }
  }

  useEffect(() => {
    organizationsApi.listOrganizations("sous_traitant").then((r) => setSousTraitants(r.organizations));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser.mutateAsync({
        ...values,
        organizationId: values.role === "sous_traitant" ? values.organizationId : undefined,
      });
      setValues(initialValues);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création du compte");
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Utilisateurs</h1>
        <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
          + Nouveau compte
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom complet">
              <Input
                required
                value={values.fullName}
                onChange={(e) => setValues({ ...values, fullName: e.target.value })}
              />
            </Field>
            <Field label="Rôle">
              <select
                className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                value={values.role}
                onChange={(e) => setValues({ ...values, role: e.target.value as typeof values.role })}
              >
                <option value="travailleur">Travailleur autonome</option>
                <option value="sous_traitant">Sous-traitant</option>
              </select>
            </Field>
            <Field label="Courriel">
              <Input
                required
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </Field>
            <Field label="Mot de passe temporaire">
              <Input
                required
                type="text"
                minLength={8}
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
              />
            </Field>
            <Field label="Téléphone">
              <Input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
            </Field>
            {values.role === "sous_traitant" && (
              <Field label="Organisation (sous-traitant)">
                <select
                  required
                  className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                  value={values.organizationId}
                  onChange={(e) => setValues({ ...values, organizationId: e.target.value })}
                >
                  <option value="">—</option>
                  {sousTraitants.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={createUser.isPending}>
              {createUser.isPending ? "Création..." : "Créer le compte"}
            </Button>
          </div>
        </form>
      )}

      {rowError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{rowError}</p>
      )}

      <div className="mt-6 space-y-3">
        {users?.map((user) => {
          const isSelf = user.id === authUser?.id;
          const busy =
            (deleteUser.isPending && deleteUser.variables === user.id) ||
            (setUserActive.isPending && setUserActive.variables?.id === user.id);
          return (
            <div
              key={user.id}
              className={`flex flex-wrap items-center gap-4 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5 ${
                user.isActive ? "" : "opacity-60"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-flow-100 text-flow-700 [&>svg]:h-4 [&>svg]:w-4">
                <IconUser />
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/admin/users/${user.id}`}
                  className="text-sm font-medium text-canvas-900 hover:text-flow-700 hover:underline"
                >
                  {user.fullName ?? user.email}
                </Link>
                {!user.isActive && (
                  <span className="ml-2 rounded-full bg-canvas-200 px-2 py-0.5 text-[11px] font-medium text-canvas-700">
                    Désactivé
                  </span>
                )}
                <p className="mt-0.5 text-xs text-canvas-600">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800"
                  >
                    {r.role.label}
                    {r.organization && ` · ${r.organization.name}`}
                  </span>
                ))}
              </div>
              {user.roles[0] && IMPERSONATABLE_ROLES.includes(user.roles[0].role.key) && (
                <Button
                  variant="secondary"
                  className="shrink-0"
                  disabled={impersonatingId === user.id}
                  onClick={() => handleImpersonate(user.id, user.roles[0].role.key)}
                >
                  {impersonatingId === user.id ? "..." : "Voir comme cet utilisateur"}
                </Button>
              )}
              {!isSelf && (
                <>
                  <Button
                    variant="secondary"
                    className="shrink-0"
                    disabled={busy}
                    onClick={() => handleToggleActive(user.id, !user.isActive)}
                  >
                    {user.isActive ? "Désactiver" : "Réactiver"}
                  </Button>
                  <Button
                    variant="danger"
                    className="shrink-0"
                    disabled={busy}
                    onClick={() => handleDelete(user.id, user.fullName ?? user.email)}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
