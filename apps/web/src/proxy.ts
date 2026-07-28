import { NextRequest, NextResponse } from "next/server";

// Next.js 16 renomeou middleware -> proxy. Checagem otimista (só lê o
// cookie) - a autorização de verdade sempre acontece na API NestJS.
//
// "Sem sessão" (login) e "sempre pública, com ou sem sessão" (agendamento
// online, visitante nunca loga) são coisas diferentes - só a primeira
// expulsa quem já está logado de volta pro dashboard.
const LOGGED_OUT_ONLY_ROUTES = ["/login"];
const ALWAYS_PUBLIC_PREFIXES = ["/agendar/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedOutOnlyRoute = LOGGED_OUT_ONLY_ROUTES.includes(pathname);
  const isAlwaysPublicRoute = ALWAYS_PUBLIC_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const hasSession = request.cookies.has("il_access_token");

  if (isAlwaysPublicRoute) {
    return NextResponse.next();
  }

  if (!isLoggedOutOnlyRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedOutOnlyRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
