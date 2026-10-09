/*
  Warnings:

  - You are about to drop the `MagicLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MagicLink" DROP CONSTRAINT "MagicLink_projectId_fkey";

-- DropTable
DROP TABLE "MagicLink";

-- CreateTable
CREATE TABLE "magicLinks" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magicLinks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "magicLinks_token_key" ON "magicLinks"("token");

-- CreateIndex
CREATE UNIQUE INDEX "magicLinks_projectId_key" ON "magicLinks"("projectId");

-- AddForeignKey
ALTER TABLE "magicLinks" ADD CONSTRAINT "magicLinks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
