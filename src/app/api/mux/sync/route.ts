import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dashboardAuthCookie, getDashboardSessionToken } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProcessingMedia = {
  id: string;
  muxUploadId: string | null;
};

type MuxUploadResponse = {
  data?: {
    id?: string;
    asset_id?: string;
    status?: string;
  };
};

type MuxAssetResponse = {
  data?: {
    id?: string;
    status?: string;
    duration?: number;
    playback_ids?: Array<{ id?: string; policy?: string }>;
  };
};

async function isDashboardSession() {
  const cookieStore = await cookies();
  return cookieStore.get(dashboardAuthCookie)?.value === getDashboardSessionToken();
}

function hlsUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

function thumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
}

async function muxFetch<T>(path: string, auth: string) {
  const response = await fetch(`https://api.mux.com/video/v1${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) {
    return undefined;
  }

  return (await response.json()) as T;
}

export async function POST() {
  if (!(await isDashboardSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    return NextResponse.json(
      { error: "Mux credentials are not configured." },
      { status: 500 },
    );
  }

  const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");
  const rows = await prisma.$queryRawUnsafe<ProcessingMedia[]>(
    'SELECT "id", "muxUploadId" FROM "MediaAsset" WHERE "muxUploadId" IS NOT NULL AND ("playbackUrl" = \'\' OR "status" <> \'ready\') ORDER BY "createdAt" DESC LIMIT 25',
  );

  let checked = 0;
  let updated = 0;

  for (const row of rows) {
    if (!row.muxUploadId) {
      continue;
    }

    checked += 1;
    const upload = await muxFetch<MuxUploadResponse>(`/uploads/${row.muxUploadId}`, auth);
    const assetId = upload?.data?.asset_id;

    if (!assetId) {
      continue;
    }

    const asset = await muxFetch<MuxAssetResponse>(`/assets/${assetId}`, auth);
    const playbackId = asset?.data?.playback_ids?.find((playback) => playback.policy === "public")?.id || asset?.data?.playback_ids?.[0]?.id;
    const status = asset?.data?.status === "ready" && playbackId ? "ready" : "processing";

    if (playbackId) {
      await prisma.$executeRawUnsafe(
        'UPDATE "MediaAsset" SET "muxAssetId" = $1, "muxPlaybackId" = $2, "durationSeconds" = $3, "playbackUrl" = $4, "thumbnailUrl" = $5, "status" = $6 WHERE "id" = $7',
        assetId,
        playbackId,
        Math.round(asset?.data?.duration || 0),
        hlsUrl(playbackId),
        thumbnailUrl(playbackId),
        status,
        row.id,
      );
    } else {
      await prisma.$executeRawUnsafe(
        'UPDATE "MediaAsset" SET "muxAssetId" = $1, "status" = $2 WHERE "id" = $3',
        assetId,
        status,
        row.id,
      );
    }

    updated += 1;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return NextResponse.json({ checked, updated });
}
