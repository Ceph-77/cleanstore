-- Lot 3 (3b) — réservation d'une tâche au nom d'un clan. Strictement additif.

ALTER TABLE "task_claims" ADD COLUMN "clan_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "reserved_by_clan_id" TEXT;

CREATE INDEX "task_claims_clan_id_idx" ON "task_claims"("clan_id");

ALTER TABLE "task_claims" ADD CONSTRAINT "task_claims_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reserved_by_clan_id_fkey"
  FOREIGN KEY ("reserved_by_clan_id") REFERENCES "clans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
