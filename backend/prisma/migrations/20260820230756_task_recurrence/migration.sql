-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "is_recurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_recurred_on" DATE;
