import "server-only";
import {
  clearSession,
  createSession,
  getAccessToken,
  getRefreshToken,
} from "@/lib/session";
import { isJwtExpired } from "@/lib/jwt";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!res.ok) {
    await clearSession();
    return null;
  }

  const tokens = await res.json();
  await createSession(tokens);
  return tokens.accessToken as string;
}

/**
 * Chama a API NestJS a partir do servidor Next.js, anexando o token da
 * sessao. Renova automaticamente o access token expirado usando o refresh
 * token (uma unica vez) antes de desistir.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let accessToken = await getAccessToken();

  if (accessToken && isJwtExpired(accessToken)) {
    accessToken = (await refreshAccessToken()) ?? undefined;
  }

  const doFetch = (token: string | undefined) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });

  let res = await doFetch(accessToken);

  if (res.status === 401 && accessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch(refreshed);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.code ?? "UNKNOWN_ERROR",
      body.message ?? `Erro ${res.status} ao chamar ${path}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
