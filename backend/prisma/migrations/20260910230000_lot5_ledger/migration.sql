-- Lot 5 (5a) — grand livre append-only. Strictement additif : nouvelle table,
-- ne touche à rien d'existant. Aucune contrainte référentielle sur partyA/partyB
-- (ils peuvent pointer un User ou une Organization) pour ne jamais bloquer une
-- écriture d'audit ; taskId a une vraie FK (SET NULL) car une Task existe
-- toujours au moment de l'écriture.

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM (
  'gain_cree', 'gain_dispo', 'commission', 'penalite', 'prime',
  'transfert_clan', 'retrait', 'retrait_echoue', 'abonnement',
  'charge_sous_traitant', 'ajustement_inspecteur'
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "party_a_id" TEXT,
    "party_a_type" TEXT,
    "party_b_id" TEXT,
    "party_b_type" TEXT,
    "task_id" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'posted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_entries_type_created_at_idx" ON "ledger_entries"("type", "created_at");
CREATE INDEX "ledger_entries_party_a_id_created_at_idx" ON "ledger_entries"("party_a_id", "created_at");
CREATE INDEX "ledger_entries_task_id_idx" ON "ledger_entries"("task_id");

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
