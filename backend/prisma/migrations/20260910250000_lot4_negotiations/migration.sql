-- Lot 4a — négociation de prix (Markettask). Strictement additif : 2 nouvelles
-- tables, rien de l'existant touché. Offres append-only (jamais réécrites).

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('open', 'accepted', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "task_negotiations" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "clan_id" TEXT,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_negotiation_offers" (
    "id" TEXT NOT NULL,
    "negotiation_id" TEXT NOT NULL,
    "author_role" TEXT NOT NULL,
    "author_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_negotiation_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_negotiations_task_id_idx" ON "task_negotiations"("task_id");
CREATE INDEX "task_negotiations_worker_id_idx" ON "task_negotiations"("worker_id");
CREATE INDEX "task_negotiation_offers_negotiation_id_idx" ON "task_negotiation_offers"("negotiation_id");

-- AddForeignKey
ALTER TABLE "task_negotiations" ADD CONSTRAINT "task_negotiations_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_negotiations" ADD CONSTRAINT "task_negotiations_worker_id_fkey"
  FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_negotiations" ADD CONSTRAINT "task_negotiations_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_negotiation_offers" ADD CONSTRAINT "task_negotiation_offers_negotiation_id_fkey"
  FOREIGN KEY ("negotiation_id") REFERENCES "task_negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
