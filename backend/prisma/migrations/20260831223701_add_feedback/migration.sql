-- CreateTable
CREATE TABLE "feedback_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "role" TEXT,
    "selector" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "is_multi" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_entries_created_at_idx" ON "feedback_entries"("created_at");

-- AddForeignKey
ALTER TABLE "feedback_entries" ADD CONSTRAINT "feedback_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
