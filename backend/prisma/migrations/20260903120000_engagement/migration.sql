-- CreateTable
CREATE TABLE "point_entries" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "task_id" TEXT,
    "kind" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_moments" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "task_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "seen_at" TIMESTAMP(3),
    "emailed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_moments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "point_entries_worker_id_created_at_idx" ON "point_entries"("worker_id", "created_at");

-- CreateIndex
CREATE INDEX "worker_moments_worker_id_seen_at_idx" ON "worker_moments"("worker_id", "seen_at");

-- CreateIndex
CREATE INDEX "worker_moments_worker_id_created_at_idx" ON "worker_moments"("worker_id", "created_at");

-- AddForeignKey
ALTER TABLE "point_entries" ADD CONSTRAINT "point_entries_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_entries" ADD CONSTRAINT "point_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_moments" ADD CONSTRAINT "worker_moments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_moments" ADD CONSTRAINT "worker_moments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
