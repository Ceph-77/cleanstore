-- Product-analytics events. Additive; no foreign keys (events outlive users).
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT,
    "role" TEXT,
    "session_id" TEXT,
    "path" TEXT,
    "props" JSONB,
    "source" TEXT NOT NULL DEFAULT 'client',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_name_created_at_idx" ON "analytics_events"("name", "created_at");
CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events"("session_id");
