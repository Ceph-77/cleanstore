-- Lot 2 (2a) — champs catalogue des modèles de tâches. Strictement additif.
-- category, fenêtre horaire indicative, photo début/fin obligatoire.

-- AlterTable
ALTER TABLE "task_templates"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "time_window_start" TEXT,
  ADD COLUMN "time_window_end" TEXT,
  ADD COLUMN "requires_start_photo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requires_end_photo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tasks"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "time_window_start" TEXT,
  ADD COLUMN "time_window_end" TEXT,
  ADD COLUMN "requires_start_photo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requires_end_photo" BOOLEAN NOT NULL DEFAULT false;
