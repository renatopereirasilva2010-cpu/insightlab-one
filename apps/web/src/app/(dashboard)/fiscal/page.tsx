import Link from "next/link";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  fiscalDocumentStatusLabels,
  fiscalDocumentStatusVariants,
} from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { FiscalDocument, Sale, Payment, Client } from "@/lib/api-types";
import { NewDocumentButton } from "./new-document-button";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NFSE: "NFS-e",
  NFE: "NF-e",
  NFCE: "NFC-e",
  OTHER: "Outro",
};

export default async function FiscalDocumentsPage() {
  const user = await verifySession();

  const [{ items: documents, error }, { items: sales }, { items: payments }, { items: clients }] =
    await Promise.all([
      safeList<FiscalDocument>("/v1/fiscal-documents"),
      safeList<Sale>("/v1/sales"),
      safeList<Payment>("/v1/payments"),
      safeList<Client>("/v1/clients"),
    ]);

  const sorted = [...documents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documentos Fiscais</h1>
          <p className="text-muted-foreground">Notas emitidas a partir de vendas e pagamentos.</p>
        </div>
        {hasPermission(user, "fiscal-documents.create") && (
          <NewDocumentButton sales={sales} payments={payments} clients={clients} />
        )}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<FiscalDocument>
        rows={sorted}
        rowKey={(d) => d.id}
        emptyMessage="Nenhum documento fiscal ainda."
        columns={[
          { header: "Tipo", cell: (d) => DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType },
          { header: "Origem", cell: (d) => d.sourceType },
          { header: "Número", cell: (d) => d.referenceNumber ?? "—" },
          {
            header: "Status",
            cell: (d) => (
              <StatusBadge
                status={d.status}
                labels={fiscalDocumentStatusLabels}
                variants={fiscalDocumentStatusVariants}
              />
            ),
          },
          { header: "Criado em", cell: (d) => formatDateTime(d.createdAt) },
          {
            header: "",
            className: "text-right",
            cell: (d) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/fiscal/${d.id}`}>Abrir</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
