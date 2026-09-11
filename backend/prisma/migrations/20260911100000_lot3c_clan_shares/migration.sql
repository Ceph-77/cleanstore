-- Lot 3c — parts de clan. Deux changements :
-- 1) worker_earnings.task_id n'est plus unique À LUI SEUL : un partage de
--    clan accepté crée sa PROPRE ligne pour le coéquipier, distincte de
--    celle du réservateur. Remplacé par un unique COMPOSÉ (task_id,
--    worker_id) — au plus une ligne par (tâche, travailleur), ce qui reste
--    vrai pour toutes les tâches sans partage (aucune ligne existante n'est
--    dupliquée, migration sans perte).
-- 2) Nouvelle table clan_share_claims (réclamations de part).

-- DropIndex
DROP INDEX "worker_earnings_task_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "worker_earnings_task_id_worker_id_key" ON "worker_earnings"("task_id", "worker_id");

-- CreateEnum
CREATE TYPE "ClanShareStatus" AS ENUM ('pending', 'accepted', 'refused', 'inspector_awarded');

-- CreateTable
CREATE TABLE "clan_share_claims" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "claimant_id" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "note" TEXT,
    "completed_step_ids" TEXT[],
    "status" "ClanShareStatus" NOT NULL DEFAULT 'pending',
    "decided_by" TEXT,
    "decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "clan_share_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clan_share_claims_task_id_idx" ON "clan_share_claims"("task_id");
CREATE INDEX "clan_share_claims_claimant_id_idx" ON "clan_share_claims"("claimant_id");

-- AddForeignKey
ALTER TABLE "clan_share_claims" ADD CONSTRAINT "clan_share_claims_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clan_share_claims" ADD CONSTRAINT "clan_share_claims_claimant_id_fkey"
  FOREIGN KEY ("claimant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clan_share_claims" ADD CONSTRAINT "clan_share_claims_decided_by_fkey"
  FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
