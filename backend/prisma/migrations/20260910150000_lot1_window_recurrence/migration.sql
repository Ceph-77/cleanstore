-- Lot 1 (1c) — fenêtre de visibilité à 15 h, récurrence à 15 h, +25 % urgence.
-- Strictement additif. `visible_from` NULL = visible (les tâches existantes ne
-- disparaissent pas). Lien optionnel instance -> tâche récurrente parente.

-- AlterTable
ALTER TABLE "tasks"
  ADD COLUMN "visible_from" TIMESTAMP(3),
  ADD COLUMN "late_premium_applied" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recurring_parent_id" TEXT;

-- CreateIndex
CREATE INDEX "tasks_recurring_parent_id_idx" ON "tasks"("recurring_parent_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurring_parent_id_fkey"
  FOREIGN KEY ("recurring_parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
