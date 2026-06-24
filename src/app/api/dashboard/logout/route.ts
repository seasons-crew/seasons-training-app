import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dashboardAuthCookie } from "@/lib/dashboard-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(dashboardAuthCookie);

  redirect("/dashboard/login");
}
