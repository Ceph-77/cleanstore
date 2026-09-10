-- Lot 2 (2d) — matériel consommé + « réservable par » (solo / clan / les deux).
-- Strictement additif. Données stockées maintenant, appliquées aux Lots 3 (clan)
-- et 6 (décrément de stock).

ALTER TABLE "task_templates"
  ADD COLUMN "consumables" JSONB,
  ADD COLUMN "reservable_by" TEXT NOT NULL DEFAULT 'solo',
  ADD COLUMN "min_clan_size" INTEGER;

ALTER TABLE "tasks"
  ADD COLUMN "consumables" JSONB,
  ADD COLUMN "reservable_by" TEXT NOT NULL DEFAULT 'solo',
  ADD COLUMN "min_clan_size" INTEGER;
