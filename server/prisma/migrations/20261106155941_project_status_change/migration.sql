/*
  Warnings:

  - You are about to drop the column `status` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "status",
ADD COLUMN     "is_on_hold" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "ProjectStatus";
