import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAccessToken, getSessionUser, type SessionUser } from "@/lib/session";

/**
 * Checagem otimista (le só o cookie, não bate na API) - suficiente pra
 * decidir o que renderizar. A checagem real de autorização acontece sempre
 * na API NestJS, em cada chamada feita via apiFetch().
 */
export const verifySession = cache(async (): Promise<SessionUser> => {
  const token = await getAccessToken();
  const user = await getSessionUser();

  // Sem nenhum cookie: certamente deslogado. Se o access token expirou mas
  // o cookie do usuário ainda existe, deixa passar - o refresh automático
  // acontece dentro de apiFetch() na primeira chamada real à API.
  if (!token || !user) {
    redirect("/login");
  }

  return user;
});

export function hasPermission(user: SessionUser, permission: string): boolean {
  return user.permissions.includes(permission);
}
