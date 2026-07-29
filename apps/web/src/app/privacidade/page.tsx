import { apiFetch, ApiError } from "@/lib/api";
import type { LegalDocument } from "@/lib/api-types";

export default async function PrivacyPolicyPage() {
  let document: LegalDocument | null = null;
  let error: string | null = null;

  try {
    document = await apiFetch<LegalDocument>("/v1/legal/documents/current?type=PRIVACY_POLICY");
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Não foi possível carregar a política de privacidade agora.";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6 py-10">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {document && (
        <>
          <div>
            <h1 className="text-2xl font-semibold">{document.title}</h1>
            <p className="text-muted-foreground text-sm">Versão {document.version}</p>
          </div>
          <p className="text-foreground whitespace-pre-line text-sm leading-relaxed">
            {document.content}
          </p>
        </>
      )}
    </div>
  );
}
