import { useState, type FormEvent } from "react";
import { AppLayout } from "../components/common/AppLayout";
import { Button } from "../components/common/Button";
import { Field } from "../components/common/Field";
import { Input } from "../components/common/Input";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../api/auth";
import { ApiError } from "../api/client";
import { ProgressCard } from "../components/engagement/ProgressCard";

export function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [values, setValues] = useState({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordValues, setPasswordValues] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setProfileSubmitting(true);
    try {
      await updateProfile(values);
      setProfileMessage("Profil mis à jour.");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (passwordValues.newPassword !== passwordValues.confirm) {
      setPasswordError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await authApi.changePassword(passwordValues.currentPassword, passwordValues.newPassword);
      setPasswordMessage("Mot de passe changé avec succès.");
      setPasswordValues({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Mon profil</h1>
      <p className="mt-1 text-sm text-canvas-600">{user?.email}</p>

      <ProgressCard />

      <form
        onSubmit={handleProfileSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5"
      >
        <h2 className="text-sm font-semibold text-canvas-900">Informations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom complet">
            <Input
              value={values.fullName}
              onChange={(e) => setValues({ ...values, fullName: e.target.value })}
            />
          </Field>
          <Field label="Téléphone">
            <Input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
          </Field>
          <Field label="Adresse">
            <Input value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />
          </Field>
        </div>
        {profileMessage && <p className="rounded-lg bg-flow-50 px-3 py-2 text-sm text-flow-800">{profileMessage}</p>}
        {profileError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={profileSubmitting}>
            {profileSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5"
      >
        <h2 className="text-sm font-semibold text-canvas-900">Changer de mot de passe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Mot de passe actuel">
            <Input
              required
              type="password"
              value={passwordValues.currentPassword}
              onChange={(e) => setPasswordValues({ ...passwordValues, currentPassword: e.target.value })}
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <Input
              required
              type="password"
              minLength={8}
              value={passwordValues.newPassword}
              onChange={(e) => setPasswordValues({ ...passwordValues, newPassword: e.target.value })}
            />
          </Field>
          <Field label="Confirmer">
            <Input
              required
              type="password"
              minLength={8}
              value={passwordValues.confirm}
              onChange={(e) => setPasswordValues({ ...passwordValues, confirm: e.target.value })}
            />
          </Field>
        </div>
        {passwordMessage && (
          <p className="rounded-lg bg-flow-50 px-3 py-2 text-sm text-flow-800">{passwordMessage}</p>
        )}
        {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={passwordSubmitting}>
            {passwordSubmitting ? "Changement..." : "Changer le mot de passe"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
