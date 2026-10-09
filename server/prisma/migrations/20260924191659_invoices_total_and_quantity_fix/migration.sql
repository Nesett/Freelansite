/*
  Warnings:

  - Added the required column `quantity` to the `invoiceItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoiceItems" ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;
