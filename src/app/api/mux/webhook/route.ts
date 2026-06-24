import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { applyMuxAssetToMedia, markMediaErrored, mediaIdFromMuxData, type MuxAssetData, type MuxUploadData } from "@/lib/mux-media";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MuxWebhookPayload = {
  type?: string;
  data?: (MuxAssetData & MuxUploadData & {
    asset_id?: string;
    upload_id?: string;
  });
};

function requireWebhookToken(request: Request) {
  const secret = process.env.MUX_WEBHOOK_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const token = new URL(request.url).searchParams.get("token");
  return token === secret;
}

async function updateByMediaIdOrAssetId(mediaAssetId: string | undefined, asset: MuxAssetData) {
  if (mediaAssetId) {
    return applyMuxAssetToMedia(mediaAssetId, asset);
  }

  if (!asset.id) {
    return undefined;
  }

  const row = await prisma.mediaAsset.findFirst({
    where: { muxAssetId: asset.id },
    select: { id: true },
  });

  if (!row) {
    return undefined;
  }

  return applyMuxAssetToMedia(row.id, asset);
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
  const mediaAssetId = mediaIdFromMuxData(data);

  if ((event.type === "video.upload.asset_created" || event.type === "video.asset.created") && data.asset_id) {
    if (mediaAssetId) {
      await prisma.$executeRawUnsafe(
        'UPDATE "MediaAsset" SET "muxAssetId" = $1, "status" = $2 WHERE "id" = $3',
        data.asset_id,
        "processing",
        mediaAssetId,
      );
    }
  }

  if (event.type === "video.asset.ready" || event.type === "video.asset.created") {
    await updateByMediaIdOrAssetId(mediaAssetId, data);
  }

  if (event.type === "video.asset.errored" || event.type === "video.upload.cancelled" || event.type === "video.upload.timed_out") {
    if (mediaAssetId) {
      await markMediaErrored(mediaAssetId);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return NextResponse.json({ ok: true });
}
