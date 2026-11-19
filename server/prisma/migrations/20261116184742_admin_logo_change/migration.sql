-- CreateEnum
CREATE TYPE "LogoStyle" AS ENUM ('WORDMARK', 'SYMBOL');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "logo_style" "LogoStyle" NOT NULL DEFAULT 'WORDMARK';
