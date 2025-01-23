/*
  Warnings:

  - You are about to drop the column `admin` on the `GroupMember` table. All the data in the column will be lost.
  - You are about to drop the column `delete` on the `GroupMember` table. All the data in the column will be lost.
  - You are about to drop the column `write` on the `GroupMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupMember" DROP COLUMN "admin",
DROP COLUMN "delete",
DROP COLUMN "write",
ADD COLUMN     "access" TEXT NOT NULL DEFAULT 'read';
