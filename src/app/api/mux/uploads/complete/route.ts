import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dashboardAuthCookie, getDashboardSessionToken } from "@/lib/dashboard-auth";
import { markMediaUploadComplete } from "@/lib/mux-media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isDashboardSession() {
  const cookieStore = await cookies();
  return cookieStore.get(dashboardAuthCookie)?.value === getDashboardSessionToken();
}

export async function POST(request: Request) {
  if (!(await isDashboardSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const mediaAssetId = typeof body.mediaAssetId === "string" ? body.mediaAssetId : "";

  if (!mediaAssetId) {
    return NextResponse.json({ error: "mediaAssetId is required." }, { status: 400 });
  }

  await markMediaUploadComplete(mediaAssetId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return NextResponse.json({ ok: true });
}
