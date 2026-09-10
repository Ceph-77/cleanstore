-- Lot 1 (1d) — contrôles de récurrence avant 15 h : sauter le jour, mettre un
-- magasin en pause. Strictement additif.

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "recurrence_skip_date" DATE;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN "recurrence_paused" BOOLEAN NOT NULL DEFAULT false;
