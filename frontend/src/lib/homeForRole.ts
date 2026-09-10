import type { RoleKey } from "../types";

/**
 * Page d'accueil après connexion, selon le rôle PRINCIPAL.
 * inspecteur + rôles console (comptable, mécanicien, développeur, chef d'équipe)
 * n'ont pas encore d'accueil dédié — tranche 3. `/profile` est joignable par
 * tout compte authentifié (pas de boucle de redirection).
 */
export function homeForRole(role: RoleKey | null | undefined): string {
  if (role === "admin") return "/stores";
  if (role === "sous_traitant") return "/markettask/stores";
  if (role === "travailleur") return "/markettask/tasks";
  return "/profile";
}
