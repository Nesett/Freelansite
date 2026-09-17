/*
  Warnings:

  - You are about to drop the column `deadline` on the `projects` table. All the data in the column will be lost.
  - Added the required column `admin_id` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'CURRENTLY_WORKED_ON', 'AWAITING_APPROVAL', 'APPROVED');

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'AWAITING_APPROVAL';

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "deadline",
ADD COLUMN     "admin_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "budget" INTEGER,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "deadline" TIMESTAMP(3),
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
