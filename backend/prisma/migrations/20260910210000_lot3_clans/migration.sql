-- Lot 3 (3a) — clans de travailleurs autonomes. Strictement additif (nouvelles
-- tables, aucune modification de l'existant).

-- CreateTable
CREATE TABLE "clans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "founder_id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clan_members" (
    "clan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "default_share_pct" INTEGER,

    CONSTRAINT "clan_members_pkey" PRIMARY KEY ("clan_id","user_id")
);

-- CreateTable
CREATE TABLE "clan_invites" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "clan_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clans_invite_code_key" ON "clans"("invite_code");
CREATE INDEX "clans_founder_id_idx" ON "clans"("founder_id");
CREATE INDEX "clan_members_user_id_idx" ON "clan_members"("user_id");
CREATE INDEX "clan_invites_email_idx" ON "clan_invites"("email");
CREATE INDEX "clan_invites_clan_id_idx" ON "clan_invites"("clan_id");

-- AddForeignKey
ALTER TABLE "clans" ADD CONSTRAINT "clans_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clan_invites" ADD CONSTRAINT "clan_invites_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
