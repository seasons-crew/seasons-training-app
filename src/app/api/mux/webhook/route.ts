import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MuxWebhookPayload = {
  type?: string;
  data?: {
    id?: string;
    asset_id?: string;
    upload_id?: string;
    duration?: number;
    playback_ids?: Array<{ id?: string; policy?: string }>;
    meta?: {
      external_id?: string;
      title?: string;
    };
    status?: string;
  };
};

function requireWebhookToken(request: Request) {
  const secret = process.env.MUX_WEBHOOK_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const token = new URL(request.url).searchParams.get("token");
  return token === secret;
}

function hlsUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

function thumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
}

export async function POST(request: Request) {
  if (!requireWebhookToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
    return NextResponse.json({ ok: true });
  }

  const event = (await request.json().catch(() => ({}))) as MuxWebhookPayload;
  const data = event.data || {};

  if (event.type === "video.upload.asset_created" && data.asset_id) {
    await prisma.mediaAsset.updateMany({
      where: {
        OR: [
          { id: data.meta?.external_id },
        ],
      },
      data: {
        muxAssetId: data.asset_id,
      },
    });
    if (data.meta?.external_id) {
      await prisma.$executeRawUnsafe(
        'UPDATE "MediaAsset" SET "status" = $1 WHERE "id" = $2',
        "processing",
        data.meta.external_id,
      );
    }
  }

  if (event.type === "video.asset.ready") {
    const playbackId = data.playback_ids?.find((playback) => playback.policy === "public")?.id || data.playback_ids?.[0]?.id;

    if (playbackId) {
      await prisma.mediaAsset.updateMany({
        where: {
          OR: [
            { id: data.meta?.external_id },
            { muxAssetId: data.id },
          ],
        },
        data: {
          durationSeconds: Math.round(data.duration || 0),
          muxAssetId: data.id,
          muxPlaybackId: playbackId,
          playbackUrl: hlsUrl(playbackId),
          thumbnailUrl: thumbnailUrl(playbackId),
        },
      });
      if (data.meta?.external_id) {
        await prisma.$executeRawUnsafe(
          'UPDATE "MediaAsset" SET "status" = $1 WHERE "id" = $2',
          "ready",
          data.meta.external_id,
        );
      }
    }
  }

  if (event.type === "video.asset.errored" || event.type === "video.upload.cancelled" || event.type === "video.upload.timed_out") {
    if (data.meta?.external_id) {
      await prisma.$executeRawUnsafe(
        'UPDATE "MediaAsset" SET "status" = $1 WHERE "id" = $2',
        "errored",
        data.meta.external_id,
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return NextResponse.json({ ok: true });
}
