-- Lot 1 (1b) — relevé de compteur (odomètre) au démarrage et à la complétion.
-- Strictement additif. `requires_odometer` défaut false ; activé sur le modèle
-- « Polissage » (compteur de la polisseuse), pas rétroactivement sur les tâches
-- déjà créées (elles gardent leur copie de config).

-- AlterTable
ALTER TABLE "task_templates" ADD COLUMN "requires_odometer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tasks"
  ADD COLUMN "requires_odometer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "start_odometer" DECIMAL(65,30),
  ADD COLUMN "end_odometer" DECIMAL(65,30),
  ADD COLUMN "start_photo_key" TEXT,
  ADD COLUMN "end_photo_key" TEXT;

UPDATE "task_templates" SET "requires_odometer" = true WHERE "name" = 'Polissage';
