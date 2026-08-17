import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field } from "../components/common/Field";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Logo } from "../components/common/Logo";
import { ApiError } from "../api/client";

const initialValues = { fullName: "", email: "", password: "", phone: "", address: "" };

export function RegisterWorkerPage() {
  const { registerWorker } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerWorker(values);
      navigate("/marketplace/tasks");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas-0 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-linen-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-flow-100 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-6 rounded-2xl border border-canvas-200 bg-white p-8 shadow-xl shadow-canvas-900/5"
      >
        <div className="space-y-1">
          <Logo size="lg" />
          <p className="text-sm text-canvas-600">Inscription — Travailleur autonome</p>
        </div>
        <div className="space-y-4">
          <Field label="Nom complet">
            <Input
              required
              value={values.fullName}
              onChange={(e) => setValues({ ...values, fullName: e.target.value })}
            />
          </Field>
          <Field label="Courriel">
            <Input
              required
              type="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
          </Field>
          <Field label="Mot de passe">
            <Input
              required
              type="password"
              minLength={8}
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
            />
          </Field>
          <Field label="Téléphone">
            <Input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
          </Field>
          <Field label="Adresse">
            <Input value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />
          </Field>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Création du compte..." : "Créer mon compte"}
        </Button>
        <p className="text-center text-sm text-canvas-600">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-medium text-flow-700 hover:text-flow-900">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
