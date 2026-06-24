import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const config = {
  matcher: ["/panel/:path*", "/onboarding/:path*", "/admin/:path*", "/giris", "/kayit"],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/giris" || pathname === "/kayit";

  if (isAuthPage) {
    if (session) {
      const dest = session.role === "SUPER_ADMIN" ? "/admin" : "/panel";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/giris", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/panel", req.url));
  }

  if ((pathname.startsWith("/panel") || pathname.startsWith("/onboarding")) && session.role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}
