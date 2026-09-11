import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { RoleKey } from "../../types";

/**
 * Bandeau d'onglets partagé entre les pages de gestion du Markettask
 * (Lot 4, réorganisation en onglets — pur confort de navigation, chaque
 * page garde sa propre route/logique/état ; ce bandeau ne fait que les
 * regrouper visuellement pour qu'elles se sentent comme un seul espace
 * de travail au lieu de 4 entrées éparses dans la barre latérale).
 */
const TABS: { key: string; label: string; to: string; roles: RoleKey[] }[] = [
  { key: "tasks", label: "Suivi des travaux", to: "/admin/tasks", roles: ["admin"] },
  { key: "claims", label: "Demandes", to: "/admin/claims", roles: ["admin"] },
  {
    key: "negotiations",
    label: "Négociations",
    to: "/admin/negotiations",
    roles: ["admin", "inspecteur"],
  },
  {
    key: "incidents",
    label: "Incidents",
    to: "/admin/incidents",
    roles: ["admin", "developpeur", "chef_equipe", "inspecteur"],
  },
];

export function MarketTaskTabs({ active }: { active: "tasks" | "claims" | "negotiations" | "incidents" }) {
  const { user } = useAuth();
  const userRoles = user?.roleKeys?.length ? user.roleKeys : user?.roleKey ? [user.roleKey] : [];
  const visible = TABS.filter((t) => t.roles.some((r) => userRoles.includes(r)));

  if (visible.length < 2) return null;

  return (
    <div className="mt-4 flex gap-4 overflow-x-auto border-b border-canvas-200">
      {visible.map((t) => (
        <Link
          key={t.key}
          to={t.to}
          className={`shrink-0 border-b-2 pb-2.5 text-sm font-medium transition-colors ${
            active === t.key
              ? "border-flow-600 text-flow-700"
              : "border-transparent text-canvas-600 hover:text-canvas-900"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
