import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Field } from "../components/common/Field";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Logo } from "../components/common/Logo";
import { ApiError } from "../api/client";
import * as authApi from "../api/auth";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [values, setValues] = useState({ newPassword: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (values.newPassword !== values.confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(token, values.newPassword);
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ce lien est invalide ou a expiré");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas-0 px-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-linen-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-flow-100 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-6 rounded-2xl border border-canvas-200 bg-white p-8 shadow-xl shadow-canvas-900/5"
      >
        <div className="space-y-1">
          <Logo size="lg" />
          <p className="text-sm text-canvas-600">Nouveau mot de passe</p>
        </div>

        {!token ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Lien invalide — aucun jeton de réinitialisation trouvé.
          </p>
        ) : (
          <div className="space-y-4">
            <Field label="Nouveau mot de passe">
              <Input
                required
                type="password"
                minLength={8}
                value={values.newPassword}
                onChange={(e) => setValues({ ...values, newPassword: e.target.value })}
              />
            </Field>
            <Field label="Confirmer">
              <Input
                required
                type="password"
                minLength={8}
                value={values.confirm}
                onChange={(e) => setValues({ ...values, confirm: e.target.value })}
              />
            </Field>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting || !token}>
          {submitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </Button>

        <p className="text-center text-sm text-canvas-600">
          <Link to="/login" className="font-medium text-flow-700 hover:text-flow-900">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
