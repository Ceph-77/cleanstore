import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "./Sidebar";

export function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  if (!isImpersonating || !user) {
    return null;
  }

  async function handleStop() {
    setPending(true);
    await stopImpersonating();
    navigate("/stores");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-linen-400 px-4 py-2 text-sm font-medium text-linen-900 sm:px-6 lg:px-10">
      <span>
        Mode aperçu : {user.fullName ?? user.email} ({ROLE_LABELS[user.roleKey ?? ""] ?? user.roleKey})
      </span>
      <button
        onClick={handleStop}
        disabled={pending}
        className="rounded-lg bg-linen-900/10 px-3 py-1 text-xs font-semibold text-linen-900 transition-colors hover:bg-linen-900/20 disabled:opacity-50"
      >
        {pending ? "..." : "Retour admin"}
      </button>
    </div>
  );
}
