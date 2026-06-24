import { NextResponse, type NextRequest } from "next/server";
import {
  dashboardAuthCookie,
  getDashboardSessionToken,
} from "@/lib/dashboard-auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard") || pathname === "/dashboard/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get(dashboardAuthCookie)?.value;

  if (session === getDashboardSessionToken()) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/dashboard/login";
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
