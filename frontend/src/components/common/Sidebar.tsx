import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { playChime } from "../../utils/sound";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "./Logo";
import {
  IconStore,
  IconSimulation,
  IconTasks,
  IconInspection,
  IconInventory,
  IconLock,
  IconUser,
  IconWallet,
  IconSettings,
  IconFeedback,
  IconFile,
  IconNote,
  IconTrophy,
  IconChat,
  IconChevronRight,
  IconX,
} from "./icons";
import { useUnseenDecisionsCount } from "../../hooks/useNotifications";
import { useConsoleAlerts } from "../../hooks/useConsoleAlerts";
import type { RoleKey } from "../../types";

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  sous_traitant: "Sous-traitant",
  travailleur: "Travailleur autonome",
  grande_compagnie: "Grande compagnie",
  inspecteur: "Inspecteur",
  chef_equipe: "Chef d'équipe",
  comptable: "Comptable",
  mecanicien: "Mécanicien",
  developpeur: "Développeur",
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

/**
 * Groupe repliable de la barre latérale admin — repris de la structure
 * d'origine ("Gestion des X", "Gestion des Y"...) que Céphas décrivait au
 * tout début de la refonte console, plutôt qu'une seule longue liste plate
 * "Gestion" (19 entrées à la fin des Lots 0-8, devenue trop dense).
 * Replié par défaut, s'ouvre tout seul si la page courante est dedans.
 */
function NavGroup({
  label,
  paths,
  badge,
  children,
}: {
  label: string;
  paths: string[];
  badge?: number;
  children: ReactNode;
}) {
  const location = useLocation();
  const isActiveGroup = paths.some((p) => location.pathname.startsWith(p));
  const [open, setOpen] = useState(isActiveGroup);

  useEffect(() => {
    if (isActiveGroup) setOpen(true);
  }, [isActiveGroup]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-canvas-0/45 transition-colors hover:text-canvas-0/70"
      >
        <span className="flex items-center gap-1.5">
          <IconChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
          {label}
        </span>
        {!!badge && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-linen-400 px-1 text-[10px] font-semibold text-linen-900">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="space-y-1 pb-1">{children}</div>}
    </div>
  );
}

function AdminNav({
  onNavigate,
  pendingClaims,
  openIncidents,
  lowStock,
}: {
  onNavigate?: () => void;
  pendingClaims?: number;
  openIncidents?: number;
  lowStock?: number;
}) {
  return (
    <>
      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/30">Gestion</p>

      <NavGroup label="Gestion des magasins" paths={["/stores"]}>
        <NavItem to="/stores" icon={<IconStore />} label="Magasins" onNavigate={onNavigate} />
      </NavGroup>

      <NavGroup label="Gestion des modèles de tâches" paths={["/admin/task-templates", "/admin/recurrences"]}>
        <NavItem to="/admin/task-templates" icon={<IconTasks />} label="Modèles de tâches" onNavigate={onNavigate} />
        <NavItem to="/admin/recurrences" icon={<IconTasks />} label="Récurrences" onNavigate={onNavigate} />
      </NavGroup>

      <NavGroup label="Gestion du markettask" paths={["/admin/tasks", "/admin/claims"]} badge={pendingClaims}>
        <NavItem to="/admin/tasks" icon={<IconTasks />} label="Suivi des travaux" onNavigate={onNavigate} />
        <NavItem
          to="/admin/claims"
          icon={<IconInspection />}
          label="Demandes"
          onNavigate={onNavigate}
          badge={pendingClaims}
        />
      </NavGroup>

      <NavGroup label="Négociation & messagerie" paths={["/admin/negotiations", "/admin/messages"]}>
        <NavItem to="/admin/negotiations" icon={<IconWallet />} label="Négociations" onNavigate={onNavigate} />
        <NavItem to="/admin/messages" icon={<IconChat />} label="Messagerie (modération)" onNavigate={onNavigate} />
      </NavGroup>

      <NavGroup label="Alertes accident / incidents" paths={["/admin/incidents"]} badge={openIncidents}>
        <NavItem
          to="/admin/incidents"
          icon={<IconInspection />}
          label="Incidents"
          onNavigate={onNavigate}
          badge={openIncidents}
        />
      </NavGroup>

      <NavGroup label="Gestion des équipements / stock" paths={["/admin/inventory"]} badge={lowStock}>
        <NavItem
          to="/admin/inventory"
          icon={<IconInventory />}
          label="Équipements & stock"
          onNavigate={onNavigate}
          badge={lowStock}
        />
      </NavGroup>

      <NavGroup label="Gestion du portefeuille / finances" paths={["/admin/ledger"]}>
        <NavItem to="/admin/ledger" icon={<IconWallet />} label="Grand livre" onNavigate={onNavigate} />
      </NavGroup>

      <NavGroup label="Gestion des feedback" paths={["/admin/feedback"]}>
        <NavItem to="/admin/feedback" icon={<IconFeedback />} label="Feedback" onNavigate={onNavigate} />
      </NavGroup>

      <NavGroup label="Gestion des rewards / performance" paths={["/admin/contributions", "/leaderboard"]}>
        <NavItem to="/admin/contributions" icon={<IconTrophy />} label="Contributions" onNavigate={onNavigate} />
        <NavItem to="/leaderboard" icon={<IconTrophy />} label="Classement" onNavigate={onNavigate} />
      </NavGroup>

      <NavGroup
        label="Utilisateurs & équipes"
        paths={["/admin/users", "/admin/clan-shares"]}
      >
        <NavItem to="/admin/users" icon={<IconUser />} label="Utilisateurs & équipes" onNavigate={onNavigate} />
        <NavItem to="/admin/clan-shares" icon={<IconUser />} label="Parts de clan" onNavigate={onNavigate} />
      </NavGroup>

      <NavGroup
        label="Système"
        paths={["/admin/simulations", "/admin/journal", "/admin/analytics", "/admin/settings"]}
      >
        <NavItem to="/admin/simulations" icon={<IconSimulation />} label="Simulations" onNavigate={onNavigate} />
        <NavItem to="/admin/journal" icon={<IconNote />} label="Journal d'audit" onNavigate={onNavigate} />
        <NavItem to="/admin/analytics" icon={<IconFile />} label="Parcours" onNavigate={onNavigate} />
        <NavItem to="/admin/settings" icon={<IconSettings />} label="Réglages" onNavigate={onNavigate} />
      </NavGroup>
    </>
  );
}

/**
 * Menu console pour les rôles non-admin (comptable, développeur…). On ne montre
 * que les sections dont la PAGE leur est ouverte aujourd'hui — pour l'instant le
 * Journal d'audit. Les autres pages restent admin-only (interfaces dédiées par
 * rôle à venir).
 */
function ConsoleNav({
  sections,
  onNavigate,
  lowStock,
}: {
  sections: string[];
  onNavigate?: () => void;
  lowStock?: number;
}) {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-canvas-0/35">
        Gestion
      </p>
      {sections.includes("audit") && (
        <NavItem to="/admin/journal" icon={<IconNote />} label="Journal d'audit" onNavigate={onNavigate} />
      )}
      {sections.includes("finance") && (
        <NavItem to="/admin/ledger" icon={<IconWallet />} label="Grand livre" onNavigate={onNavigate} />
      )}
      {sections.includes("markettask") && (
        <>
          <NavItem to="/admin/negotiations" icon={<IconWallet />} label="Négociations" onNavigate={onNavigate} />
          <NavItem to="/admin/clan-shares" icon={<IconUser />} label="Parts de clan" onNavigate={onNavigate} />
        </>
      )}
      {sections.includes("feedback") && (
        <>
          <NavItem to="/admin/feedback" icon={<IconFeedback />} label="Feedback" onNavigate={onNavigate} />
          <NavItem to="/admin/incidents" icon={<IconInspection />} label="Incidents" onNavigate={onNavigate} />
        </>
      )}
      {sections.includes("inventory") && (
        <NavItem
          to="/admin/inventory"
          icon={<IconInventory />}
          label="Équipements & stock"
          onNavigate={onNavigate}
          badge={lowStock}
        />
      )}
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
      <NavItem to="/markettask/clans" icon={<IconUser />} label="Mes clans" onNavigate={onNavigate} />
      <NavItem to="/wallet" icon={<IconWallet />} label="Portefeuille" onNavigate={onNavigate} />
    </>
  );
}

function SidebarContent({ onNavigate, onCloseButton }: { onNavigate?: () => void; onCloseButton?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.roleKey as RoleKey | undefined;
  const roleKeys = (user?.roleKeys?.length ? user.roleKeys : role ? [role] : []) as RoleKey[];
  const has = (r: RoleKey) => roleKeys.includes(r);
  const { data: unseenCount } = useUnseenDecisionsCount();
  const { data: alerts } = useConsoleAlerts();

  const prevUnseen = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (
      typeof unseenCount === "number" &&
      typeof prevUnseen.current === "number" &&
      unseenCount > prevUnseen.current
    ) {
      playChime("notify");
    }
    prevUnseen.current = unseenCount;
  }, [unseenCount]);

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
        <NavItem to="/messages" icon={<IconChat />} label="Messages" onNavigate={onNavigate} />
        <NavItem to="/rewards" icon={<IconTrophy />} label="Rewards" onNavigate={onNavigate} />
        {has("admin") ? (
          <AdminNav
            onNavigate={onNavigate}
            pendingClaims={alerts?.pendingClaims}
            openIncidents={alerts?.openIncidents}
            lowStock={alerts?.lowStock}
          />
        ) : (alerts?.sections?.length ?? 0) > 0 ? (
          <ConsoleNav sections={alerts!.sections} onNavigate={onNavigate} lowStock={alerts?.lowStock} />
        ) : has("sous_traitant") ? (
          <SousTraitantNav onNavigate={onNavigate} unseenCount={unseenCount} />
        ) : has("travailleur") ? (
          <TravailleurNav onNavigate={onNavigate} unseenCount={unseenCount} />
        ) : null}
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
