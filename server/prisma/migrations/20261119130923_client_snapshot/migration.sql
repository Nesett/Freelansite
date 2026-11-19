-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_client_id_fkey";

-- AlterTable: add the snapshot columns as nullable first
ALTER TABLE "projects" ADD COLUMN     "client_company_name" TEXT,
ADD COLUMN     "client_email" TEXT,
ADD COLUMN     "client_name" TEXT,
ALTER COLUMN "client_id" DROP NOT NULL;

-- Backfill existing projects from their current client
UPDATE "projects" p
SET "client_name" = c."name",
    "client_company_name" = c."company_name",
    "client_email" = c."email"
FROM "clients" c
WHERE c."id" = p."client_id";

-- Now it's safe to make the email required
ALTER TABLE "projects" ALTER COLUMN "client_email" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;