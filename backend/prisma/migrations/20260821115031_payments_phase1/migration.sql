-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('pending', 'disputed', 'available', 'withdrawn');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('pending', 'paid', 'failed');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_payment_method_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_account_id" TEXT,
ADD COLUMN     "stripe_onboarding_done" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "commission_rate_percent" DECIMAL(65,30) NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_earnings" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "gross_amount" DECIMAL(65,30) NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'pending',
    "available_at" TIMESTAMP(3) NOT NULL,
    "stripe_charge_id" TEXT,
    "withdrawal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "gross_amount" DECIMAL(65,30) NOT NULL,
    "commission_amount" DECIMAL(65,30) NOT NULL,
    "net_amount" DECIMAL(65,30) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'pending',
    "stripe_transfer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "worker_earnings_task_id_key" ON "worker_earnings"("task_id");

-- CreateIndex
CREATE INDEX "worker_earnings_worker_id_status_idx" ON "worker_earnings"("worker_id", "status");

-- AddForeignKey
ALTER TABLE "worker_earnings" ADD CONSTRAINT "worker_earnings_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_earnings" ADD CONSTRAINT "worker_earnings_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_earnings" ADD CONSTRAINT "worker_earnings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_earnings" ADD CONSTRAINT "worker_earnings_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
