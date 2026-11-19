/*
  Warnings:

  - A unique constraint covering the columns `[stripe_customer_id]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "admins_stripe_customer_id_key" ON "admins"("stripe_customer_id");
