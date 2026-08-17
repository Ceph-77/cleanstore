-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('before', 'after');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "task_inspections" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_inspection_photos" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "photo_type" "PhotoType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_inspection_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_inspections" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "checklist" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_inspection_photos" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "photo_type" "PhotoType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_inspection_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_inspections_task_id_key" ON "task_inspections"("task_id");

-- CreateIndex
CREATE INDEX "store_inspections_store_id_idx" ON "store_inspections"("store_id");

-- AddForeignKey
ALTER TABLE "task_inspections" ADD CONSTRAINT "task_inspections_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_inspection_photos" ADD CONSTRAINT "task_inspection_photos_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "task_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_inspections" ADD CONSTRAINT "store_inspections_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_inspection_photos" ADD CONSTRAINT "store_inspection_photos_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "store_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
