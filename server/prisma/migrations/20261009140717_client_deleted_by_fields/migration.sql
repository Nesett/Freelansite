/*
  Warnings:

  - You are about to drop the column `is_active` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "is_active",
ADD COLUMN     "deleted_by_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_by_client" BOOLEAN NOT NULL DEFAULT false;
