import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "./Logo";
import {
  IconStore,
  IconTasks,
  IconInspection,
  IconInventory,
  IconLock,
  IconUser,
  IconWallet,
  IconSettings,
  IconFeedback,
  IconTrophy,
  IconX,
} from "./icons";
import { useUnseenDecisionsCount } from "../../hooks/useNotifications";
import type { RoleKey } from "../../types";

export const ROLE_LABELS: Record<string, string> = {
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
  onNavigate,
  badge,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onNavigate?: () => void;
  badge?: number;
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
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-canvas-0/60 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <span className="flex items-center gap-3">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {label}
      </span>
      {!!badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-linen-400 px-1.5 text-[11px] font-semibold text-linen-900">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/35">Opérations</p>
      <NavItem to="/stores" icon={<IconStore />} label="Magasins" onNavigate={onNavigate} />
      <NavItem to="/admin/tasks" icon={<IconTasks />} label="Suivi des travaux" onNavigate={onNavigate} />
      <NavItem to="/admin/claims" icon={<IconInspection />} label="Demandes" onNavigate={onNavigate} />
      <NavItem to="/admin/users" icon={<IconUser />} label="Utilisateurs" onNavigate={onNavigate} />
      <NavItem to="/leaderboard" icon={<IconTrophy />} label="Classement" onNavigate={onNavigate} />
      <NavItem to="/admin/settings" icon={<IconSettings />} label="Réglages" onNavigate={onNavigate} />
      <NavItem to="/admin/feedback" icon={<IconFeedback />} label="Feedback" onNavigate={onNavigate} />
      <NavItem to="/inventory" icon={<IconInventory />} label="Inventaire" disabled />
    </>
  );
}

function SousTraitantNav({ onNavigate, unseenCount }: { onNavigate?: () => void; unseenCount?: number }) {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/35">Markettask</p>
      <NavItem
        to="/markettask/stores"
        icon={<IconStore />}
        label="Magasins disponibles"
        onNavigate={onNavigate}
        badge={unseenCount}
      />
      <NavItem to="/markettask/store-tasks" icon={<IconTasks />} label="Tâches de mes magasins" onNavigate={onNavigate} />
      <NavItem to="/leaderboard" icon={<IconTrophy />} label="Classement" onNavigate={onNavigate} />
      <NavItem to="/markettask/payment-settings" icon={<IconWallet />} label="Méthode de paiement" onNavigate={onNavigate} />
    </>
  );
}

function TravailleurNav({ onNavigate, unseenCount }: { onNavigate?: () => void; unseenCount?: number }) {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/35">Markettask</p>
      <NavItem to="/markettask/tasks" icon={<IconTasks />} label="Tâches disponibles" onNavigate={onNavigate} />
      <NavItem
        to="/markettask/my-tasks"
        icon={<IconInspection />}
        label="Mes tâches"
        onNavigate={onNavigate}
        badge={unseenCount}
      />
      <NavItem to="/wallet" icon={<IconWallet />} label="Portefeuille" onNavigate={onNavigate} />
    </>
  );
}

function SidebarContent({ onNavigate, onCloseButton }: { onNavigate?: () => void; onCloseButton?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.roleKey as RoleKey | undefined;
  const { data: unseenCount } = useUnseenDecisionsCount();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      <div className="flex items-center justify-between px-2">
        <Logo inverted />
        {onCloseButton && (
          <button
            onClick={onCloseButton}
            aria-label="Fermer le menu"
            className="rounded-lg p-1.5 text-canvas-0/60 hover:bg-white/5 hover:text-white md:hidden"
          >
            <IconX className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-10 flex-1 space-y-1">
        {role === "admin" && <AdminNav onNavigate={onNavigate} />}
        {role === "sous_traitant" && <SousTraitantNav onNavigate={onNavigate} unseenCount={unseenCount} />}
        {role === "travailleur" && <TravailleurNav onNavigate={onNavigate} unseenCount={unseenCount} />}
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10"
        >
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
        </Link>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-canvas-0/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Déconnexion
        </button>
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Desktop: static sidebar, always visible */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col bg-canvas-900 px-4 py-6 md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-canvas-900/60" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-canvas-900 px-4 py-6 shadow-xl">
            <SidebarContent onNavigate={onClose} onCloseButton={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
