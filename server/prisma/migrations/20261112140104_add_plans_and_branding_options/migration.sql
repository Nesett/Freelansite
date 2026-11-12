-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "brand_accent" TEXT,
ADD COLUMN     "brand_primary" TEXT,
ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';
