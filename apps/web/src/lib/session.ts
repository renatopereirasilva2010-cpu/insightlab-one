import "server-only";
import { cookies } from "next/headers";

const ACCESS_COOKIE = "il_access_token";
const REFRESH_COOKIE = "il_refresh_token";
const USER_COOKIE = "il_user";

// TTLs espelham JWT_ACCESS_TTL / JWT_REFRESH_TTL do backend (services/api/.env).
const ACCESS_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  email: string;
  tenantId: string;
  unitId: string | null;
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function createSession(tokens: TokenPair) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(ACCESS_MAX_AGE_SECONDS));
  cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_MAX_AGE_SECONDS));

  // Permissions/unitId nao vem no JWT (so sub/email/tenantId) - guarda junto
  // pra UI nao precisar bater na API so pra saber o que mostrar no menu.
  // Nunca usar isso como fonte de verdade de autorizacao - quem decide de
  // verdade e sempre a API, em cada chamada real.
  cookieStore.set(USER_COOKIE, JSON.stringify(tokens.user), cookieOptions(ACCESS_MAX_AGE_SECONDS));
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(USER_COOKIE);
}

export { ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE };
