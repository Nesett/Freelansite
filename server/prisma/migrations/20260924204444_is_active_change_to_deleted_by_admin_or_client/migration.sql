/*
  Warnings:

  - You are about to drop the column `is_active` on the `milestones` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoiceItems" ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "deleted_by_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_by_client" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "milestones" DROP COLUMN "is_active",
ADD COLUMN     "deleted_by_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_by_client" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "is_active",
ADD COLUMN     "deleted_by_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_by_client" BOOLEAN NOT NULL DEFAULT false;
