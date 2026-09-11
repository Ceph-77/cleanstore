-- Lot 7a/7b — triage feedback + incidents. Additif : nouvelles colonnes
-- nullable/defaultées sur feedback_entries (comportement identique pour les
-- entrées existantes — toutes redeviennent "non_lu"), 2 nouvelles tables.
-- Push (VAPID) et génération PDF restent hors scope, voir schema.prisma.

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('non_lu', 'lu', 'en_traitement', 'resolu', 'ignore');
CREATE TYPE "IncidentType" AS ENUM ('blessure', 'degat', 'vol', 'incendie', 'sante', 'autre');
CREATE TYPE "IncidentSeverity" AS ENUM ('mineur', 'majeur', 'urgence');
CREATE TYPE "IncidentStatus" AS ENUM ('ouverte', 'en_traitement', 'resolue');

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "store_id" TEXT,
    "task_id" TEXT,
    "reported_by" TEXT,
    "assigned_to" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ouverte',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_notes" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_notes_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "feedback_entries"
  ADD COLUMN "status" "FeedbackStatus" NOT NULL DEFAULT 'non_lu',
  ADD COLUMN "is_important" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "assigned_to" TEXT,
  ADD COLUMN "assigned_category" TEXT,
  ADD COLUMN "converted_incident_id" TEXT;

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");
CREATE INDEX "incidents_store_id_idx" ON "incidents"("store_id");
CREATE INDEX "incidents_task_id_idx" ON "incidents"("task_id");
CREATE INDEX "incident_notes_incident_id_created_at_idx" ON "incident_notes"("incident_id", "created_at");
CREATE INDEX "feedback_entries_status_idx" ON "feedback_entries"("status");
CREATE UNIQUE INDEX "feedback_entries_converted_incident_id_key" ON "feedback_entries"("converted_incident_id");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reported_by_fkey"
  FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assigned_to_fkey"
  FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incident_notes" ADD CONSTRAINT "incident_notes_incident_id_fkey"
  FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incident_notes" ADD CONSTRAINT "incident_notes_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feedback_entries" ADD CONSTRAINT "feedback_entries_assigned_to_fkey"
  FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feedback_entries" ADD CONSTRAINT "feedback_entries_converted_incident_id_fkey"
  FOREIGN KEY ("converted_incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
