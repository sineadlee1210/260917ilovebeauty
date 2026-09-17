// Blocks direct access to gated routes before any page code runs.
// Actual purchase verification still happens server-side in each route/API
// (see lib/content-access.ts) — this layer only stops unauthenticated users
// and unauthenticated admin access from ever reaching those pages.
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isMyPage = pathname.startsWith("/mypage");
  const isAdminPage = pathname.startsWith("/admin");
  const isContentPage = pathname.startsWith("/content/");

  if ((isMyPage || isContentPage || isAdminPage) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/mypage/:path*",
    "/admin/:path*",
    "/content/:path*",
  ],
};
