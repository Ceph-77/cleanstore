import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    roleKey?: string;
    impersonatorId?: string;
    impersonatorRoleKey?: string;
  }
}
