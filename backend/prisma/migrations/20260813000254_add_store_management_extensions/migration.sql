-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('unpaid', 'paid', 'overdue');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "security_access_info" TEXT,
ADD COLUMN     "special_requirements" TEXT,
ADD COLUMN     "store_hours" TEXT;

-- CreateTable
CREATE TABLE "store_contacts" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_notes" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "author_id" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_documents" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_invoices" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'unpaid',
    "issued_date" DATE,
    "due_date" DATE,
    "paid_date" DATE,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_contacts_store_id_idx" ON "store_contacts"("store_id");

-- CreateIndex
CREATE INDEX "store_notes_store_id_idx" ON "store_notes"("store_id");

-- CreateIndex
CREATE INDEX "store_documents_store_id_idx" ON "store_documents"("store_id");

-- CreateIndex
CREATE INDEX "store_invoices_store_id_idx" ON "store_invoices"("store_id");

-- AddForeignKey
ALTER TABLE "store_contacts" ADD CONSTRAINT "store_contacts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_notes" ADD CONSTRAINT "store_notes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_notes" ADD CONSTRAINT "store_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_documents" ADD CONSTRAINT "store_documents_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_documents" ADD CONSTRAINT "store_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_invoices" ADD CONSTRAINT "store_invoices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
