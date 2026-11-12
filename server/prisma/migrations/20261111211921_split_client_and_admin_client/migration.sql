-- CreateTable
CREATE TABLE "admin_clients" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT,
    "companyName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "deleted_by_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_clients_admin_id_client_id_key" ON "admin_clients"("admin_id", "client_id");

-- AddForeignKey
ALTER TABLE "admin_clients" ADD CONSTRAINT "admin_clients_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_clients" ADD CONSTRAINT "admin_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CopyData: one admin_clients row per existing client
INSERT INTO "admin_clients" ("id", "admin_id", "client_id", "name", "companyName", "phone", "address", "deleted_by_admin", "created_at")
SELECT gen_random_uuid()::text, "admin_id", "id", "name", "companyName", "phone", "address", "deleted_by_admin", "created_at"
FROM "clients";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_admin_id_fkey";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "address",
DROP COLUMN "admin_id",
DROP COLUMN "companyName",
DROP COLUMN "deleted_by_admin",
DROP COLUMN "name",
DROP COLUMN "phone";