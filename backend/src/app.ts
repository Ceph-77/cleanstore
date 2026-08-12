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
import { requireAuth } from "./modules/auth/auth.middleware";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const PgSession = connectPgSimple(session);
const sessionPool = new Pool({ connectionString: env.DATABASE_URL });

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(
  session({
    store: new PgSession({ pool: sessionPool, createTableIfMissing: true }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use("/api/auth", authRouter);
app.use("/api/stores", storesRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/users", usersRouter);

app.use(notFound);
app.use(errorHandler);
