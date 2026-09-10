-- Lot 2 (2c) — variantes de modèle de tâche (petit / grand…). Strictement additif.

-- CreateTable
CREATE TABLE "task_template_variants" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30),
    "metric_target" DECIMAL(65,30),
    "duration_minutes" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "task_template_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_template_variants_template_id_idx" ON "task_template_variants"("template_id");

-- AddForeignKey
ALTER TABLE "task_template_variants" ADD CONSTRAINT "task_template_variants_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "variant_name" TEXT;
