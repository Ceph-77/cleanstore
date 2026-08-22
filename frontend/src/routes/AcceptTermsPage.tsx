import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { Logo } from "../components/common/Logo";
import { ApiError } from "../api/client";
import type { RoleKey } from "../types";

function homeForRole(role: RoleKey | null | undefined) {
  if (role === "sous_traitant") return "/markettask/stores";
  if (role === "travailleur") return "/markettask/tasks";
  return "/stores";
}

export function AcceptTermsPage() {
  const { user, acceptTerms } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user?.termsAcceptedAt) {
    return <Navigate to={homeForRole(user.roleKey)} replace />;
  }

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      await acceptTerms();
      navigate(homeForRole(user?.roleKey), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'acceptation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas-0 px-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-linen-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-flow-100 blur-3xl" />

      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-canvas-200 bg-white p-8 shadow-xl shadow-canvas-900/5">
        <div className="space-y-1">
          <Logo size="lg" />
          <p className="text-sm text-canvas-600">Avant de continuer</p>
        </div>

        <p className="text-sm text-canvas-700">
          KLEAN'STOR a mis à jour ses conditions d'utilisation et sa politique de confidentialité. Pour continuer à
          utiliser la plateforme, tu dois les accepter.
        </p>

        <Link
          to="/terms"
          target="_blank"
          className="block rounded-lg border border-canvas-200 px-3 py-2 text-sm font-medium text-flow-700 hover:bg-canvas-50"
        >
          Lire les conditions d'utilisation et la politique de confidentialité →
        </Link>

        <label className="flex items-start gap-2 text-sm text-canvas-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-canvas-300 text-flow-600 focus:ring-flow-400"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          J'ai lu et j'accepte les conditions d'utilisation et la politique de confidentialité.
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button className="w-full" disabled={!checked || submitting} onClick={handleContinue}>
          {submitting ? "..." : "Continuer"}
        </Button>
      </div>
    </div>
  );
}
