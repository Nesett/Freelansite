-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "generated_invoice" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "budget" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "deadline" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminName" TEXT NOT NULL,
    "adminAddress" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoiceItems" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "invoiceItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoiceItems" ADD CONSTRAINT "invoiceItems_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
