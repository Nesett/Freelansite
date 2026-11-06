-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "last_invoice_number" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoiceItems" ADD COLUMN     "milestone_id" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "number" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "invoiceItems" ADD CONSTRAINT "invoiceItems_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
