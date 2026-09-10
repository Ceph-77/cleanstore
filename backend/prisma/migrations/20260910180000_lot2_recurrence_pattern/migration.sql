-- Lot 2 (2b) — motif de récurrence (quotidien / jours de semaine / jours du mois).
-- Strictement additif. NULL = quotidien (comportement historique).

ALTER TABLE "task_templates" ADD COLUMN "recurrence" JSONB;
ALTER TABLE "tasks" ADD COLUMN "recurrence" JSONB;
