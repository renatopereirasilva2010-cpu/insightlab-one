import "server-only";
import { ApiError } from "@/lib/api";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; code: string };

/**
 * Envolve uma Server Action que chama apiFetch, convertendo ApiError em um
 * retorno serializável (Server Actions não podem lançar objetos arbitrários
 * pro client) em vez de deixar a exceção estourar pro form.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, message: err.message, code: err.code };
    }
    return { ok: false, message: "Erro inesperado. Tente novamente.", code: "UNKNOWN_ERROR" };
  }
}
