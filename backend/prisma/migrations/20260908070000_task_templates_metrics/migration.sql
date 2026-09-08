-- Reusable task templates catalogue + per-task performance metric (pro-rata pay).

CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "task_type" TEXT,
    "default_price" DECIMAL(65,30),
    "is_negotiable" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring_default" BOOLEAN NOT NULL DEFAULT false,
    "expected_result_text" TEXT,
    "how_to_text" TEXT,
    "required_equipment" TEXT[],
    "estimated_duration_minutes" INTEGER,
    "metric_label" TEXT,
    "metric_unit" TEXT,
    "default_metric_target" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_template_steps" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "task_template_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_templates_name_key" ON "task_templates"("name");
CREATE INDEX "task_templates_is_active_idx" ON "task_templates"("is_active");
CREATE INDEX "task_template_steps_template_id_idx" ON "task_template_steps"("template_id");

ALTER TABLE "task_template_steps"
    ADD CONSTRAINT "task_template_steps_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks"
    ADD COLUMN "template_id" TEXT,
    ADD COLUMN "metric_label" TEXT,
    ADD COLUMN "metric_unit" TEXT,
    ADD COLUMN "metric_target" DECIMAL(65,30),
    ADD COLUMN "reported_metric_value" DECIMAL(65,30),
    ADD COLUMN "metric_value_source" TEXT;

ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "task_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_inspections" ADD COLUMN "corrected_metric_value" DECIMAL(65,30);
