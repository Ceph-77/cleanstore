-- Baseline: the "session" table is created and managed at runtime by connect-pg-simple
-- (createTableIfMissing: true in src/app.ts), not by Prisma. This migration exists only
-- so Prisma's migration history matches the actual database state and no longer reports drift.
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
