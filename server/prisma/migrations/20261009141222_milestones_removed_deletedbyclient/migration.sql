/*
  Warnings:

  - You are about to drop the column `deleted_by_client` on the `milestones` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "milestones" DROP COLUMN "deleted_by_client";
