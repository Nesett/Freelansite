/*
  Warnings:

  - You are about to drop the column `lastUsedAt` on the `MagicLink` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `MagicLink` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId]` on the table `MagicLink` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MagicLink_projectId_idx";

-- AlterTable
ALTER TABLE "MagicLink" DROP COLUMN "lastUsedAt",
DROP COLUMN "revokedAt";

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_projectId_key" ON "MagicLink"("projectId");
