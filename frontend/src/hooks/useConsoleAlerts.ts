import { useQuery } from "@tanstack/react-query";
import * as consoleApi from "../api/console";
import { useAuth } from "../context/AuthContext";
import { POLL_MS } from "../queryClient";

const CONSOLE_ROLES = [
  "admin",
  "comptable",
  "mecanicien",
  "chef_equipe",
  "developpeur",
  "inspecteur",
] as const;

/** Compteurs d'alerte du menu. N'interroge que pour les rôles ayant un accès console. */
export function useConsoleAlerts() {
  const { user } = useAuth();
  const roles = user?.roleKeys ?? (user?.roleKey ? [user.roleKey] : []);
  const enabled = roles.some((r) => (CONSOLE_ROLES as readonly string[]).includes(r));

  return useQuery({
    queryKey: ["console", "alerts"],
    queryFn: consoleApi.getAlerts,
    enabled,
    refetchInterval: POLL_MS,
  });
}
