-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "personal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "settings" JSONB;
