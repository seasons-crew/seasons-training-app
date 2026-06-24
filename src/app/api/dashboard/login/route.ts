import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  dashboardAuthCookie,
  getDashboardPassword,
  getDashboardSessionToken,
} from "@/lib/dashboard-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");
  const safeNext = next.startsWith("/dashboard") ? next : "/dashboard";

  if (password !== getDashboardPassword()) {
    redirect(`/dashboard/login?error=1&next=${encodeURIComponent(safeNext)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(dashboardAuthCookie, getDashboardSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(safeNext);
}
