import { notFound } from "next/navigation";
import { verifySession, hasPermission } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import {
  StatusBadge,
  fiscalDocumentStatusLabels,
  fiscalDocumentStatusVariants,
} from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import type { FiscalDocument } from "@/lib/api-types";
import { UpdateStatusButton } from "./update-status-button";

const EVENT_LABELS: Record<string, string> = {
  CREATED: "Criado",
  REQUESTED: "Solicitado",
  AUTHORIZED: "Autorizado",
  CANCELED: "Cancelado",
  ERROR: "Erro",
  NOTE: "Observação",
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NFSE: "NFS-e",
  NFE: "NF-e",
  NFCE: "NFC-e",
  OTHER: "Outro",
};

export default async function FiscalDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await verifySession();

  let doc: FiscalDocument;
  try {
    doc = await apiFetch<FiscalDocument>(`/v1/fiscal-documents/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
          </h1>
          <p className="text-muted-foreground">
            Origem: {doc.sourceType} · {doc.referenceNumber ?? "sem número"}
          </p>
        </div>
        <StatusBadge
          status={doc.status}
          labels={fiscalDocumentStatusLabels}
          variants={fiscalDocumentStatusVariants}
        />
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Provedor</p>
            <p>{doc.provider ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Chave de acesso</p>
            <p className="break-all">{doc.accessKey ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Erro</p>
            <p>
              {doc.errorCode ? `${doc.errorCode} - ${doc.errorMessage ?? ""}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Criado em</p>
            <p>{formatDateTime(doc.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {hasPermission(user, "fiscal-documents.update-status") && (
        <UpdateStatusButton documentId={doc.id} currentStatus={doc.status} />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Histórico</h2>
        <div className="space-y-2">
          {doc.events.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum evento registrado.</p>
          )}
          {doc.events.map((ev) => (
            <div key={ev.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{EVENT_LABELS[ev.eventType] ?? ev.eventType}</span>
                <span className="text-muted-foreground text-xs">{formatDateTime(ev.createdAt)}</span>
              </div>
              {ev.message && <p className="text-muted-foreground mt-1">{ev.message}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
