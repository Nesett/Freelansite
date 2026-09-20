/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "clients_inviteToken_key" ON "clients"("inviteToken");
