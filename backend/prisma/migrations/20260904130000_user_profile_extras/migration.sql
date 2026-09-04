-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_key" TEXT,
ADD COLUMN     "availability" JSONB,
ADD COLUMN     "admin_note" TEXT;
