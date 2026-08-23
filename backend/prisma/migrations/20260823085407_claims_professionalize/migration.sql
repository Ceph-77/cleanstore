-- AlterTable
ALTER TABLE "store_claims" ADD COLUMN     "decision_reason" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "seen_by_requester_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "task_claims" ADD COLUMN     "decision_reason" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "seen_by_requester_at" TIMESTAMP(3);
