import "server-only";
import { apiFetch, ApiError } from "@/lib/api";

export interface SafeListResult<T> {
  items: T[];
  error?: string;
}

/**
 * GET de lista tolerante a 403 (falta de permissão) - mostra a tela vazia
 * com um aviso em vez de derrubar a página inteira num error boundary.
 * Qualquer outro erro (500, rede) continua propagando normalmente.
 */
export async function safeList<T>(path: string): Promise<SafeListResult<T>> {
  try {
    const items = await apiFetch<T[]>(path);
    return { items };
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return { items: [], error: "Você não tem permissão para ver estes dados." };
    }
    throw err;
  }
}
