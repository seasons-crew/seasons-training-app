import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dashboardAuthCookie, getDashboardSessionToken } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function isDashboardSession() {
  const cookieStore = await cookies();
  return cookieStore.get(dashboardAuthCookie)?.value === getDashboardSessionToken();
}

export async function POST(request: Request) {
  try {
    if (!(await isDashboardSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
      return NextResponse.json(
        { error: "DATABASE_URL is required for uploads." },
        { status: 500 },
      );
    }

    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
      return NextResponse.json(
        { error: "Mux credentials are not configured." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const filename = typeof body.filename === "string" && body.filename.trim() ? body.filename.trim() : "upload";
    const title = "";
    const id = `${slugify(filename) || "upload"}-${crypto.randomUUID().slice(0, 8)}`;
    const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");

    const muxResponse = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cors_origin: request.headers.get("origin") || "*",
        new_asset_settings: {
          playback_policy: ["public"],
          video_quality: "basic",
          meta: {
            title: filename,
            external_id: id,
          },
        },
      }),
    });

    if (!muxResponse.ok) {
      const detail = await muxResponse.text();
      return NextResponse.json(
        { error: "Mux upload creation failed.", detail },
        { status: 502 },
      );
    }

    const payload = (await muxResponse.json()) as {
      data?: { id?: string; url?: string };
    };
    const upload = payload.data;

    if (!upload?.id || !upload.url) {
      return NextResponse.json(
        { error: "Mux did not return an upload URL." },
        { status: 502 },
      );
    }

    await prisma.mediaAsset.create({
      data: {
        id,
        title,
        durationSeconds: 0,
        thumbnailUrl: "",
        playbackUrl: "",
        muxUploadId: upload.id,
        status: "waiting_for_upload",
        tags: parseTags(body.tags),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/media");

    return NextResponse.json({ mediaAssetId: id, url: upload.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload setup failed." },
      { status: 500 },
    );
  }
}
