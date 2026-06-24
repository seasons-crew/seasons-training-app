import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dashboardAuthCookie, getDashboardSessionToken } from "@/lib/dashboard-auth";
import { applyMuxAssetToMedia, markMediaErrored, mediaIdFromMuxData, type MuxAssetData, type MuxUploadData } from "@/lib/mux-media";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProcessingMedia = {
  id: string;
  status: string;
  muxUploadId: string | null;
  muxAssetId: string | null;
};

type MuxUploadResponse = {
  data?: MuxUploadData;
};

type MuxAssetResponse = {
  data?: MuxAssetData;
};

type MuxAssetListResponse = {
  data?: MuxAssetData[];
};

async function isDashboardSession() {
  const cookieStore = await cookies();
  return cookieStore.get(dashboardAuthCookie)?.value === getDashboardSessionToken();
}

async function muxFetch<T>(path: string, auth: string) {
  const response = await fetch(`https://api.mux.com/video/v1${path}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return undefined;
  }

  return (await response.json()) as T;
}

async function findAssetForRow(row: ProcessingMedia, auth: string) {
  if (row.muxAssetId) {
    return (await muxFetch<MuxAssetResponse>(`/assets/${row.muxAssetId}`, auth))?.data;
  }

  if (row.muxUploadId) {
    const upload = (await muxFetch<MuxUploadResponse>(`/uploads/${row.muxUploadId}`, auth))?.data;

    if (upload?.asset_id) {
      return (await muxFetch<MuxAssetResponse>(`/assets/${upload.asset_id}`, auth))?.data;
    }

    if (upload?.status === "errored") {
      await markMediaErrored(row.id);
      return { status: "errored" } satisfies MuxAssetData;
    }
  }

  const assets = (await muxFetch<MuxAssetListResponse>("/assets?limit=100", auth))?.data || [];
  return assets.find((asset) => mediaIdFromMuxData(asset) === row.id);
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
    `SELECT "id", "status", "muxUploadId", "muxAssetId"
     FROM "MediaAsset"
     WHERE ("muxUploadId" IS NOT NULL OR "muxAssetId" IS NOT NULL)
       AND ("playbackUrl" = '' OR "status" <> 'ready')
     ORDER BY "createdAt" DESC
     LIMIT 50`,
  );

  let checked = 0;
  let updated = 0;
  let waiting = 0;
  let processing = 0;
  let errored = 0;

  for (const row of rows) {
    checked += 1;

    const asset = await findAssetForRow(row, auth);

    if (!asset?.id) {
      if (asset?.status === "errored") {
        errored += 1;
      } else if (row.status === "uploaded_processing" || row.status === "processing") {
        processing += 1;
      } else {
        waiting += 1;
        await prisma.$executeRawUnsafe(
          'UPDATE "MediaAsset" SET "status" = $1 WHERE "id" = $2',
          "waiting_for_upload",
          row.id,
        );
      }
      continue;
    }

    const status = await applyMuxAssetToMedia(row.id, asset);

    if (status === "ready") {
      updated += 1;
    } else {
      processing += 1;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return NextResponse.json({ checked, updated, waiting, processing, errored });
}
