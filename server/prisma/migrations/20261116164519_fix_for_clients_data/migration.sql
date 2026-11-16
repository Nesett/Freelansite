/*
  Warnings:

  - You are about to drop the column `address` on the `admin_clients` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `admin_clients` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `admin_clients` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `admin_clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "admin_clients" DROP COLUMN "address",
DROP COLUMN "companyName",
DROP COLUMN "name",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT;
