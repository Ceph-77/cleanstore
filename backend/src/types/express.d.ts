import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    /** Rôle principal (le plus opérationnel) — redirection post-login, libellés, analytics. */
    roleKey?: string;
    /** Tous les rôles de l'utilisateur. L'accès = l'union (voir permissions.can). */
    roleKeys?: string[];
    impersonatorId?: string;
    impersonatorRoleKey?: string;
    impersonatorRoleKeys?: string[];
  }
}
