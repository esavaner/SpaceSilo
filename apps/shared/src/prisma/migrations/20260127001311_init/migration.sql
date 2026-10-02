-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'admin', 'user');

-- CreateEnum
CREATE TYPE "GroupAccessLevel" AS ENUM ('admin', 'edit', 'read');

-- CreateEnum
CREATE TYPE "BackupDirection" AS ENUM ('outgoing', 'incoming');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "settings" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "hash" TEXT NOT NULL,
    "stemKey" TEXT NOT NULL,
    "metadata" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "displayable" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "personal" BOOLEAN DEFAULT false,
    "color" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "pairSecret" TEXT NOT NULL,
    "direction" "BackupDirection" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "schedule" TEXT NOT NULL,
    "copyPhotos" BOOLEAN NOT NULL DEFAULT false,
    "copyFiles" BOOLEAN NOT NULL DEFAULT false,
    "copyNotes" BOOLEAN NOT NULL DEFAULT false,
    "sourceServerLabel" TEXT NOT NULL,
    "sourceServerBaseUrl" TEXT NOT NULL,
    "sourceServerKey" TEXT NOT NULL,
    "destinationServerLabel" TEXT NOT NULL,
    "destinationServerBaseUrl" TEXT NOT NULL,
    "destinationServerKey" TEXT NOT NULL,
    "destinationPath" TEXT,
    "remoteConfigId" TEXT,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "running" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "lastStartedAt" TIMESTAMP(3),
    "lastFinishedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "lastStats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "access" "GroupAccessLevel" NOT NULL DEFAULT 'read',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlbumToMedia" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AlbumToMedia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AlbumToGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AlbumToGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GroupToMedia" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupToMedia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Media_ownerId_stemKey_key" ON "Media"("ownerId", "stemKey");

-- CreateIndex
CREATE INDEX "Media_ownerId_capturedAt_createdAt_idx" ON "Media"("ownerId", "capturedAt", "createdAt");

-- CreateIndex
CREATE INDEX "MediaFile_mediaId_idx" ON "MediaFile"("mediaId");

-- CreateIndex
CREATE INDEX "MediaFile_hash_idx" ON "MediaFile"("hash");

-- CreateIndex
CREATE INDEX "Album_ownerId_capturedAt_createdAt_idx" ON "Album"("ownerId", "capturedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Album_parentId_capturedAt_createdAt_idx" ON "Album"("parentId", "capturedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Backup_pairId_key" ON "Backup"("pairId");

-- CreateIndex
CREATE INDEX "Backup_direction_active_nextRunAt_idx" ON "Backup"("direction", "active", "nextRunAt");

-- CreateIndex
CREATE INDEX "Backup_createdById_direction_idx" ON "Backup"("createdById", "direction");

-- CreateIndex
CREATE INDEX "Note_groupId_updatedAt_createdAt_idx" ON "Note"("groupId", "updatedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Note_ownerId_updatedAt_createdAt_idx" ON "Note"("ownerId", "updatedAt", "createdAt");

-- CreateIndex
CREATE INDEX "_AlbumToMedia_B_index" ON "_AlbumToMedia"("B");

-- CreateIndex
CREATE INDEX "_AlbumToGroup_B_index" ON "_AlbumToGroup"("B");

-- CreateIndex
CREATE INDEX "_GroupToMedia_B_index" ON "_GroupToMedia"("B");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToMedia" ADD CONSTRAINT "_AlbumToMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToMedia" ADD CONSTRAINT "_AlbumToMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToGroup" ADD CONSTRAINT "_AlbumToGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToGroup" ADD CONSTRAINT "_AlbumToGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToMedia" ADD CONSTRAINT "_GroupToMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToMedia" ADD CONSTRAINT "_GroupToMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
