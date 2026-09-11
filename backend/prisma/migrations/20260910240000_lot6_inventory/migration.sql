-- Lot 6 — équipements / stock par magasin. Strictement additif : 2 nouvelles
-- tables, rien de l'existant touché. Mouvements append-only.

-- CreateEnum
CREATE TYPE "InventoryItemKind" AS ENUM ('consommable', 'produit_chimique', 'gaz', 'machine');

-- CreateTable
CREATE TABLE "store_inventory_items" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "kind" "InventoryItemKind" NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "low_threshold" DECIMAL(65,30),
    "expiry_date" DATE,
    "odometer" DECIMAL(65,30),
    "last_service_at" DATE,
    "next_service_at" DATE,
    "condition" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "delta" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "task_id" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_inventory_items_store_id_idx" ON "store_inventory_items"("store_id");
CREATE INDEX "store_inventory_items_store_id_is_active_idx" ON "store_inventory_items"("store_id", "is_active");
CREATE INDEX "inventory_movements_item_id_created_at_idx" ON "inventory_movements"("item_id", "created_at");
CREATE INDEX "inventory_movements_task_id_idx" ON "inventory_movements"("task_id");

-- AddForeignKey
ALTER TABLE "store_inventory_items" ADD CONSTRAINT "store_inventory_items_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "store_inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
