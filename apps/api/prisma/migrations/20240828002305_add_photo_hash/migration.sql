/*
  Warnings:

  - Added the required column `hash` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "hash" TEXT NOT NULL,
ALTER COLUMN "metadata" DROP NOT NULL;
