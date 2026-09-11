-- Lot 8 — Rewards : contributions (badges/priorité d'accès sont calculés à la
-- volée, aucune table nécessaire pour eux). Additif : 1 nouvelle table.

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('soumise', 'a_l_etude', 'adoptee', 'rejetee');

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "submitted_by" TEXT,
    "status" "ContributionStatus" NOT NULL DEFAULT 'soumise',
    "decision_note" TEXT,
    "points_awarded" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contributions_status_idx" ON "contributions"("status");

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_submitted_by_fkey"
  FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
