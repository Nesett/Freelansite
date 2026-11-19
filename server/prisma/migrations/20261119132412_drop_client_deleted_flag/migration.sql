/*
  Warnings:

  - You are about to drop the column `deleted_by_client` on the `clients` table. All the data in the column will be lost.

*/
DELETE FROM "clients" WHERE "deleted_by_client" = true;
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "deleted_by_client";
