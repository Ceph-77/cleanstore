import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field } from "../components/common/Field";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Logo } from "../components/common/Logo";
import { ApiError } from "../api/client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/stores");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
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
          <p className="text-sm text-canvas-600">Connexion</p>
        </div>
        <div className="space-y-4">
          <Field label="Courriel">
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Mot de passe">
            <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <p className="text-right text-xs">
            <Link to="/forgot-password" className="text-flow-700 hover:text-flow-900">
              Mot de passe oublié ?
            </Link>
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Connexion..." : "Se connecter"}
        </Button>
        <p className="text-center text-sm text-canvas-600">
          Travailleur autonome ?{" "}
          <Link to="/register" className="font-medium text-flow-700 hover:text-flow-900">
            Créer un compte
          </Link>
        </p>
      </form>
    </div>
  );
}
