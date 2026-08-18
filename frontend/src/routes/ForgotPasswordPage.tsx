import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Field } from "../components/common/Field";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Logo } from "../components/common/Logo";
import { ApiError } from "../api/client";
import * as authApi from "../api/auth";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas-0 px-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-linen-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-flow-100 blur-3xl" />

      <div className="relative w-full max-w-sm space-y-6 rounded-2xl border border-canvas-200 bg-white p-8 shadow-xl shadow-canvas-900/5">
        <div className="space-y-1">
          <Logo size="lg" />
          <p className="text-sm text-canvas-600">Mot de passe oublié</p>
        </div>

        {done ? (
          <p className="rounded-lg bg-flow-50 px-3 py-2 text-sm text-flow-800">
            Si ce courriel existe dans notre système, un lien de réinitialisation vient d'être envoyé.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Courriel">
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-canvas-600">
          <Link to="/login" className="font-medium text-flow-700 hover:text-flow-900">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
