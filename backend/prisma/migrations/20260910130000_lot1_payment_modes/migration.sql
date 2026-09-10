-- Lot 1 (1a) — modes de paiement. Strictement additif : aucun DROP, aucune
-- colonne existante touchée. Le mode par défaut est 'fixed' = comportement
-- historique ; les modèles/tâches à cible métrique passent en 'metric_prorata'
-- pour préserver exactement le calcul de gain actuel.

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('fixed', 'hourly', 'per_unit', 'metric_prorata');

-- AlterTable
ALTER TABLE "task_templates"
  ADD COLUMN "payment_mode" "PaymentMode" NOT NULL DEFAULT 'fixed',
  ADD COLUMN "hourly_rate" DECIMAL(65,30),
  ADD COLUMN "hourly_cap_minutes" INTEGER,
  ADD COLUMN "unit_price" DECIMAL(65,30),
  ADD COLUMN "unit_label" TEXT;

-- AlterTable
ALTER TABLE "tasks"
  ADD COLUMN "payment_mode" "PaymentMode" NOT NULL DEFAULT 'fixed',
  ADD COLUMN "hourly_rate" DECIMAL(65,30),
  ADD COLUMN "hourly_cap_minutes" INTEGER,
  ADD COLUMN "unit_price" DECIMAL(65,30),
  ADD COLUMN "unit_label" TEXT,
  ADD COLUMN "reported_units" DECIMAL(65,30),
  ADD COLUMN "worked_minutes" INTEGER;

-- Préserver le comportement actuel : cible métrique => paiement au prorata.
UPDATE "task_templates" SET "payment_mode" = 'metric_prorata' WHERE "default_metric_target" IS NOT NULL;
UPDATE "tasks" SET "payment_mode" = 'metric_prorata' WHERE "metric_target" IS NOT NULL;
