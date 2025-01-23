/*
  Warnings:

  - The `access` column on the `GroupMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('admin', 'edit', 'read');

-- AlterTable
ALTER TABLE "GroupMember" DROP COLUMN "access",
ADD COLUMN     "access" "AccessLevel" NOT NULL DEFAULT 'read';
