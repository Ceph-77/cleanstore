-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "store_claims" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "store_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_claims" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "task_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_claims_store_id_idx" ON "store_claims"("store_id");

-- CreateIndex
CREATE INDEX "store_claims_status_idx" ON "store_claims"("status");

-- CreateIndex
CREATE INDEX "task_claims_task_id_idx" ON "task_claims"("task_id");

-- CreateIndex
CREATE INDEX "task_claims_status_idx" ON "task_claims"("status");

-- AddForeignKey
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_claims" ADD CONSTRAINT "task_claims_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_claims" ADD CONSTRAINT "task_claims_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
