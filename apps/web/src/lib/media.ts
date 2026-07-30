const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Fotos/logo enviados via upload voltam da API como caminho relativo
 * (ex.: "/uploads/clients/t-1/c-1.png") - o browser renderiza <img> direto
 * da API (nao passa pelo Next), entao precisa da URL absoluta do host dela.
 */
export function buildMediaUrl(relativeUrl: string | null | undefined): string | null {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) return relativeUrl;
  return `${API_BASE_URL}${relativeUrl}`;
}
