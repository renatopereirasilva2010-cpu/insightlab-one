import { NextRequest, NextResponse } from "next/server";

// Next.js 16 renomeou middleware -> proxy. Checagem otimista (só lê o
// cookie) - a autorização de verdade sempre acontece na API NestJS.
const PUBLIC_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const hasSession = request.cookies.has("il_access_token");

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
