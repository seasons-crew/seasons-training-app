#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const [, , inputPath = "mux-assets.json", outputPath = "media-seed.json"] =
  process.argv;

const input = JSON.parse(await readFile(inputPath, "utf8"));
const assets = Array.isArray(input) ? input : (input.assets ?? input.data ?? []);

const seed = assets.map((asset) => {
  const playbackId =
    asset.playback_ids?.[0]?.id ?? asset.playbackId ?? asset.muxPlaybackId;
  const duration = Math.round(asset.duration ?? asset.durationSeconds ?? 0);

  return {
    id: asset.id,
    title: asset.title ?? asset.filename ?? `Mux asset ${asset.id}`,
    durationSeconds: duration,
    muxAssetId: asset.id,
    muxPlaybackId: playbackId,
    thumbnailUrl: playbackId
      ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
      : "",
    playbackUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : "",
    sourceDriveUrl: asset.sourceDriveUrl ?? null,
    tags: asset.tags ?? [],
  };
});

await writeFile(outputPath, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`Wrote ${seed.length} media assets to ${outputPath}`);
