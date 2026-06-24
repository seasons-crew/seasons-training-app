-- Add upload lifecycle fields for Mux direct uploads.
ALTER TABLE "MediaAsset" ADD COLUMN "muxUploadId" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ready';

CREATE UNIQUE INDEX "MediaAsset_muxUploadId_key" ON "MediaAsset"("muxUploadId");
CREATE INDEX "MediaAsset_status_idx" ON "MediaAsset"("status");
