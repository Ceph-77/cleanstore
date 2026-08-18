-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "estimated_duration_minutes" INTEGER,
ADD COLUMN     "expected_result_text" TEXT,
ADD COLUMN     "how_to_text" TEXT,
ADD COLUMN     "required_equipment" TEXT[],
ADD COLUMN     "started_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "task_expected_photos" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_expected_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_steps" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_expected_photos_task_id_idx" ON "task_expected_photos"("task_id");

-- CreateIndex
CREATE INDEX "task_steps_task_id_idx" ON "task_steps"("task_id");

-- AddForeignKey
ALTER TABLE "task_expected_photos" ADD CONSTRAINT "task_expected_photos_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_steps" ADD CONSTRAINT "task_steps_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
