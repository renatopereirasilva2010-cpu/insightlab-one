// So decodifica o payload pra exibir na UI (ex.: nome/permissoes no menu) -
// nunca usar isso como verificacao de seguranca. Quem valida a assinatura de
// verdade e sempre a API NestJS, em toda chamada.
export function decodeJwtPayload<T = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
