-- Lot 5 — distinguer "gain suspendu pour incident" de "gain suspendu pour
-- mauvaise inspection" (même statut "disputed", raison différente). Additif :
-- 1 colonne nullable, rien d'existant touché.

-- AlterTable
ALTER TABLE "worker_earnings" ADD COLUMN "held_for_incident" TEXT;

-- CreateIndex
CREATE INDEX "worker_earnings_held_for_incident_idx" ON "worker_earnings"("held_for_incident");

-- AddForeignKey
ALTER TABLE "worker_earnings" ADD CONSTRAINT "worker_earnings_held_for_incident_fkey"
  FOREIGN KEY ("held_for_incident") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
