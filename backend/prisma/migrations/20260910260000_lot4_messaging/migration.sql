-- Lot 4b — messagerie. Strictement additif : 3 nouvelles tables, rien de
-- l'existant touché. Messages conservés indéfiniment (jamais de DELETE côté
-- application).

-- CreateEnum
CREATE TYPE "MessageThreadKind" AS ENUM ('task', 'clan', 'global_jazzette', 'global_annonces', 'adhoc');

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "kind" "MessageThreadKind" NOT NULL,
    "task_id" TEXT,
    "clan_id" TEXT,
    "title" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_thread_participants" (
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_thread_participants_pkey" PRIMARY KEY ("thread_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_task_id_key" ON "message_threads"("task_id");
CREATE UNIQUE INDEX "message_threads_clan_id_key" ON "message_threads"("clan_id");
CREATE INDEX "message_threads_kind_idx" ON "message_threads"("kind");
CREATE INDEX "message_thread_participants_user_id_idx" ON "message_thread_participants"("user_id");
CREATE INDEX "messages_thread_id_created_at_idx" ON "messages"("thread_id", "created_at");

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "message_thread_participants" ADD CONSTRAINT "message_thread_participants_thread_id_fkey"
  FOREIGN KEY ("thread_id") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_thread_participants" ADD CONSTRAINT "message_thread_participants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_fkey"
  FOREIGN KEY ("thread_id") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
