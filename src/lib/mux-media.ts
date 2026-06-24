import { prisma } from "./prisma";

export type MuxPlaybackId = {
  id?: string;
  policy?: string;
};

export type MuxAssetData = {
  id?: string;
  status?: string;
  duration?: number;
  playback_ids?: MuxPlaybackId[];
  passthrough?: string;
  meta?: {
    external_id?: string;
    title?: string;
  };
};

export type MuxUploadData = {
  id?: string;
  asset_id?: string;
  status?: string;
  passthrough?: string;
  meta?: {
    external_id?: string;
    title?: string;
  };
};

export function hlsUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function thumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
}

export function mediaIdFromMuxData(data: MuxAssetData | MuxUploadData) {
  return data.passthrough || data.meta?.external_id || undefined;
}

export function publicPlaybackId(asset: MuxAssetData) {
  return asset.playback_ids?.find((playback) => playback.policy === "public")?.id || asset.playback_ids?.[0]?.id;
}

export async function markMediaUploadComplete(mediaAssetId: string) {
  await prisma.$executeRawUnsafe(
    'UPDATE "MediaAsset" SET "status" = $1 WHERE "id" = $2 AND "status" <> $3',
    "uploaded_processing",
    mediaAssetId,
    "ready",
  );
}

export async function markMediaErrored(mediaAssetId: string) {
  await prisma.$executeRawUnsafe(
    'UPDATE "MediaAsset" SET "status" = $1 WHERE "id" = $2',
    "errored",
    mediaAssetId,
  );
}

export async function applyMuxAssetToMedia(mediaAssetId: string, asset: MuxAssetData) {
  if (!asset.id) {
    return "missing_asset";
  }

  const playbackId = publicPlaybackId(asset);
  const isReady = asset.status === "ready" && Boolean(playbackId);
  const status = isReady ? "ready" : "processing";

  if (isReady && playbackId) {
    await prisma.$executeRawUnsafe(
      'UPDATE "MediaAsset" SET "muxAssetId" = $1, "muxPlaybackId" = $2, "durationSeconds" = $3, "playbackUrl" = $4, "thumbnailUrl" = $5, "status" = $6 WHERE "id" = $7',
      asset.id,
      playbackId,
      Math.round(asset.duration || 0),
      hlsUrl(playbackId),
      thumbnailUrl(playbackId),
      status,
      mediaAssetId,
    );
  } else {
    await prisma.$executeRawUnsafe(
      'UPDATE "MediaAsset" SET "muxAssetId" = $1, "status" = $2 WHERE "id" = $3',
      asset.id,
      status,
      mediaAssetId,
    );
  }

  return status;
}
