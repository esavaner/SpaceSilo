ALTER TABLE "Photo"
ADD COLUMN "capturedAt" TIMESTAMP(3);

UPDATE "Photo"
SET "capturedAt" = COALESCE(NULLIF("metadata"->>'capturedAt', '')::timestamptz, "createdAt");

ALTER TABLE "Photo"
ALTER COLUMN "capturedAt" SET NOT NULL,
ALTER COLUMN "capturedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Photo_ownerId_capturedAt_createdAt_idx" ON "Photo"("ownerId", "capturedAt", "createdAt");