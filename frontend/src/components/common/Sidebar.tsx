import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "./Logo";
import {
  IconStore,
  IconTasks,
  IconInspection,
  IconInventory,
  IconLock,
  IconUser,
} from "./icons";
import type { RoleKey } from "../../types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  sous_traitant: "Sous-traitant",
  travailleur: "Travailleur autonome",
  grande_compagnie: "Grande compagnie",
  inspecteur: "Inspecteur",
};

function NavItem({
  to,
  icon,
  label,
  disabled,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-canvas-0/30">
        <span className="flex items-center gap-3">
          <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          {label}
        </span>
        <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-canvas-0/40">
          Bientôt
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-canvas-0/60 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {label}
    </NavLink>
  );
}

function AdminNav() {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/35">Opérations</p>
      <NavItem to="/stores" icon={<IconStore />} label="Magasins" />
      <NavItem to="/admin/claims" icon={<IconInspection />} label="Demandes" />
      <NavItem to="/admin/users" icon={<IconUser />} label="Utilisateurs" />
      <NavItem to="/inventory" icon={<IconInventory />} label="Inventaire" disabled />
    </>
  );
}

function SousTraitantNav() {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/35">Marketplace</p>
      <NavItem to="/marketplace/stores" icon={<IconStore />} label="Magasins disponibles" />
    </>
  );
}

function TravailleurNav() {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/35">Marketplace</p>
      <NavItem to="/marketplace/tasks" icon={<IconTasks />} label="Tâches disponibles" />
    </>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const role = user?.roleKey as RoleKey | undefined;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-canvas-900 px-4 py-6">
      <div className="px-2">
        <Logo inverted />
      </div>

      <nav className="mt-10 flex-1 space-y-1">
        {role === "admin" && <AdminNav />}
        {role === "sous_traitant" && <SousTraitantNav />}
        {role === "travailleur" && <TravailleurNav />}
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linen-400 text-xs font-semibold text-linen-900">
            {(user?.fullName ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.fullName ?? user?.email}</p>
            <p className="flex items-center gap-1 text-xs text-canvas-0/45">
              <IconLock className="h-3 w-3" />
              {role ? ROLE_LABELS[role] : ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-canvas-0/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
