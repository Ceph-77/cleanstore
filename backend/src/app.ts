import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { storesRouter } from "./modules/stores/stores.routes";
import { tasksRouter } from "./modules/tasks/tasks.routes";
import { organizationsRouter } from "./modules/organizations/organizations.routes";
import { usersRouter } from "./modules/users/users.routes";
import { storeContactsRouter } from "./modules/storeContacts/storeContacts.routes";
import { storeNotesRouter } from "./modules/storeNotes/storeNotes.routes";
import { storeDocumentsRouter } from "./modules/storeDocuments/storeDocuments.routes";
import { storeInvoicesRouter } from "./modules/storeInvoices/storeInvoices.routes";
import { storeMarketplaceRouter, storeClaimsAdminRouter } from "./modules/storeClaims/storeClaims.routes";
import { taskMarketplaceRouter, taskClaimsAdminRouter } from "./modules/taskClaims/taskClaims.routes";
import { myTasksRouter } from "./modules/myTasks/myTasks.routes";
import { taskInstructionsRouter } from "./modules/taskInstructions/taskInstructions.routes";
import { systemRouter } from "./modules/system/system.routes";
import { paymentsRouter, paymentsWebhookRouter } from "./modules/payments/payments.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { requireAuth, requireRole } from "./modules/auth/auth.middleware";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const PgSession = connectPgSimple(session);
const sessionPool = new Pool({ connectionString: env.DATABASE_URL });

export const app = express();

// Render (and most PaaS) terminate TLS before the app; without this, Express
// doesn't know the original connection was HTTPS, and secure cookies break.
app.set("trust proxy", 1);

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Mounted before express.json() — Stripe webhook signature verification needs the raw body.
app.use("/api/payments", paymentsWebhookRouter);

app.use(express.json());
app.use(
  session({
    store: new PgSession({ pool: sessionPool, createTableIfMissing: true }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Cross-site in production (frontend and backend on different domains)
      // requires "none", which in turn requires secure: true.
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use("/api/auth", authRouter);
app.use("/api/stores", storesRouter);
app.use("/api/tasks", requireRole("admin"), tasksRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/users", usersRouter);
app.use("/api/store-contacts", requireRole("admin"), storeContactsRouter);
app.use("/api/store-notes", requireRole("admin"), storeNotesRouter);
app.use("/api/store-documents", requireRole("admin"), storeDocumentsRouter);
app.use("/api/store-invoices", requireRole("admin"), storeInvoicesRouter);
app.use("/api/marketplace", requireAuth, storeMarketplaceRouter);
app.use("/api/marketplace", requireAuth, taskMarketplaceRouter);
app.use("/api/marketplace", requireAuth, myTasksRouter);
app.use("/api/task-instructions", requireAuth, taskInstructionsRouter);
app.use("/api/system", systemRouter);
app.use("/api/payments", requireAuth, paymentsRouter);
app.use("/api/notifications", requireAuth, notificationsRouter);
app.use("/api/store-claims", storeClaimsAdminRouter);
app.use("/api/task-claims", taskClaimsAdminRouter);

app.use(notFound);
app.use(errorHandler);
