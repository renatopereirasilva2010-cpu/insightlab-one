import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  dataSubjectRequestStatusLabels,
  dataSubjectRequestStatusVariants,
} from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { DataSubjectRequest } from "@/lib/api-types";
import { RequestRowActions } from "./request-row-actions";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: "Acesso",
  CORRECTION: "Correção",
  DELETION: "Exclusão",
  PORTABILITY: "Portabilidade",
  CONSENT_REVOCATION: "Revogação de consentimento",
};

export default async function LgpdPage() {
  const user = await verifySession();
  const { items: requests, error } = await safeList<DataSubjectRequest>(
    "/v1/legal/data-subject-requests",
  );

  const sorted = [...requests].sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">LGPD — Solicitações de titulares</h1>
        <p className="text-muted-foreground">
          Pedidos de acesso, correção, portabilidade, exclusão ou revogação de consentimento,
          enviados pelo canal público de agendamento (Art. 18 da LGPD).
        </p>
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<DataSubjectRequest>
        rows={sorted}
        rowKey={(r) => r.id}
        emptyMessage="Nenhuma solicitação registrada ainda."
        columns={[
          { header: "Solicitante", cell: (r) => r.requesterName },
          { header: "Contato", cell: (r) => r.requesterContact },
          { header: "Tipo", cell: (r) => REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType },
          {
            header: "Status",
            cell: (r) => (
              <StatusBadge
                status={r.status}
                labels={dataSubjectRequestStatusLabels}
                variants={dataSubjectRequestStatusVariants}
              />
            ),
          },
          { header: "Recebida em", cell: (r) => formatDateTime(r.requestedAt) },
          {
            header: "",
            className: "text-right",
            cell: (r) =>
              hasPermission(user, "data-subject-requests.update") ? (
                <RequestRowActions request={r} />
              ) : null,
          },
        ]}
      />
    </div>
  );
}
