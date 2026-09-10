-- Lot 0 — socle Console de gestion : 4 nouveaux rôles + journal d'audit.
-- Strictement additif : aucun DROP, aucune colonne existante touchée.

-- AlterEnum
-- Ajoute 4 valeurs à l'enum RoleKey. PostgreSQL 12+ (Neon) accepte plusieurs
-- ADD VALUE dans la même migration tant qu'elles ne sont pas utilisées avant COMMIT.
ALTER TYPE "RoleKey" ADD VALUE IF NOT EXISTS 'chef_equipe';
ALTER TYPE "RoleKey" ADD VALUE IF NOT EXISTS 'comptable';
ALTER TYPE "RoleKey" ADD VALUE IF NOT EXISTS 'mecanicien';
ALTER TYPE "RoleKey" ADD VALUE IF NOT EXISTS 'developpeur';

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_label" TEXT,
    "action" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "summary" TEXT,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_section_created_at_idx" ON "audit_logs"("section", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
