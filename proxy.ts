import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

const PROTECTED = [
  "/home",
  "/plans",
  "/calendar",
  "/songs",
  "/team",
  "/people",
  "/schedule",
  "/events",
  "/resources",
  "/chat",
  "/activity",
  "/settings",
  "/availability",
  "/onboarding",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtected && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/plans",
    "/plans/:path*",
    "/calendar",
    "/calendar/:path*",
    "/songs",
    "/songs/:path*",
    "/team",
    "/team/:path*",
    "/people",
    "/people/:path*",
    "/schedule",
    "/schedule/:path*",
    "/events",
    "/events/:path*",
    "/resources",
    "/resources/:path*",
    "/chat",
    "/chat/:path*",
    "/activity",
    "/activity/:path*",
    "/settings",
    "/settings/:path*",
    "/availability",
    "/availability/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/login",
  ],
};
