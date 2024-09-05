/*
  Warnings:

  - You are about to drop the `Share` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AlbumToShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FileToShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FolderToShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PhotoToShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SharedToRelation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `thumbnailPath` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Share" DROP CONSTRAINT "Share_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "_AlbumToShare" DROP CONSTRAINT "_AlbumToShare_A_fkey";

-- DropForeignKey
ALTER TABLE "_AlbumToShare" DROP CONSTRAINT "_AlbumToShare_B_fkey";

-- DropForeignKey
ALTER TABLE "_FileToShare" DROP CONSTRAINT "_FileToShare_A_fkey";

-- DropForeignKey
ALTER TABLE "_FileToShare" DROP CONSTRAINT "_FileToShare_B_fkey";

-- DropForeignKey
ALTER TABLE "_FolderToShare" DROP CONSTRAINT "_FolderToShare_A_fkey";

-- DropForeignKey
ALTER TABLE "_FolderToShare" DROP CONSTRAINT "_FolderToShare_B_fkey";

-- DropForeignKey
ALTER TABLE "_PhotoToShare" DROP CONSTRAINT "_PhotoToShare_A_fkey";

-- DropForeignKey
ALTER TABLE "_PhotoToShare" DROP CONSTRAINT "_PhotoToShare_B_fkey";

-- DropForeignKey
ALTER TABLE "_SharedToRelation" DROP CONSTRAINT "_SharedToRelation_A_fkey";

-- DropForeignKey
ALTER TABLE "_SharedToRelation" DROP CONSTRAINT "_SharedToRelation_B_fkey";

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "thumbnailPath" TEXT NOT NULL;

-- DropTable
DROP TABLE "Share";

-- DropTable
DROP TABLE "_AlbumToShare";

-- DropTable
DROP TABLE "_FileToShare";

-- DropTable
DROP TABLE "_FolderToShare";

-- DropTable
DROP TABLE "_PhotoToShare";

-- DropTable
DROP TABLE "_SharedToRelation";

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceUser" (
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "admin" BOOLEAN NOT NULL DEFAULT false,
    "write" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceUser_pkey" PRIMARY KEY ("spaceId","userId")
);

-- CreateTable
CREATE TABLE "_PhotoToSpace" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToSpace" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FileToSpace" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FolderToSpace" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PhotoToSpace_AB_unique" ON "_PhotoToSpace"("A", "B");

-- CreateIndex
CREATE INDEX "_PhotoToSpace_B_index" ON "_PhotoToSpace"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToSpace_AB_unique" ON "_AlbumToSpace"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToSpace_B_index" ON "_AlbumToSpace"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FileToSpace_AB_unique" ON "_FileToSpace"("A", "B");

-- CreateIndex
CREATE INDEX "_FileToSpace_B_index" ON "_FileToSpace"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FolderToSpace_AB_unique" ON "_FolderToSpace"("A", "B");

-- CreateIndex
CREATE INDEX "_FolderToSpace_B_index" ON "_FolderToSpace"("B");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceUser" ADD CONSTRAINT "SpaceUser_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceUser" ADD CONSTRAINT "SpaceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhotoToSpace" ADD CONSTRAINT "_PhotoToSpace_A_fkey" FOREIGN KEY ("A") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhotoToSpace" ADD CONSTRAINT "_PhotoToSpace_B_fkey" FOREIGN KEY ("B") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToSpace" ADD CONSTRAINT "_AlbumToSpace_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToSpace" ADD CONSTRAINT "_AlbumToSpace_B_fkey" FOREIGN KEY ("B") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToSpace" ADD CONSTRAINT "_FileToSpace_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToSpace" ADD CONSTRAINT "_FileToSpace_B_fkey" FOREIGN KEY ("B") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToSpace" ADD CONSTRAINT "_FolderToSpace_A_fkey" FOREIGN KEY ("A") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToSpace" ADD CONSTRAINT "_FolderToSpace_B_fkey" FOREIGN KEY ("B") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
