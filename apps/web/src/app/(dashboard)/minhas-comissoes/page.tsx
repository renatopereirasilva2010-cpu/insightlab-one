import { verifySession } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  commissionStatusLabels,
  commissionStatusVariants,
} from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Commission, Client } from "@/lib/api-types";

export default async function MinhasComissoesPage() {
  await verifySession();

  let commissions: Commission[] = [];
  let errorMessage: string | null = null;

  try {
    commissions = await apiFetch<Commission[]>("/v1/commissions/me");
  } catch (err) {
    errorMessage =
      err instanceof ApiError
        ? err.message
        : "Não foi possível carregar seu extrato de comissão.";
  }

  const { items: clients } = await safeList<Client>("/v1/clients");
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const totalPendente = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);
  const totalLiberado = commissions
    .filter((c) => c.status === "RELEASED")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Minhas Comissões</h1>
        <p className="text-muted-foreground">
          Extrato somente leitura da sua comissão, por venda.
        </p>
      </div>

      {errorMessage && (
        <p className="text-sm text-muted-foreground" role="alert">
          {errorMessage}
        </p>
      )}

      {!errorMessage && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="text-muted-foreground text-sm">Pendente</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalPendente)}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-muted-foreground text-sm">Liberado</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalLiberado)}</p>
            </div>
          </div>

          <DataTable<Commission>
            rows={commissions}
            rowKey={(c) => c.id}
            emptyMessage="Nenhuma comissão registrada ainda."
            columns={[
              {
                header: "Cliente",
                cell: (c) => {
                  const clientId = c.sale?.clientId;
                  return (clientId && clientById.get(clientId)?.name) || "—";
                },
              },
              { header: "Base", cell: (c) => formatCurrency(c.baseAmount) },
              { header: "Comissão", cell: (c) => formatCurrency(c.commissionAmount) },
              {
                header: "Status",
                cell: (c) => (
                  <StatusBadge
                    status={c.status}
                    labels={commissionStatusLabels}
                    variants={commissionStatusVariants}
                  />
                ),
              },
              { header: "Criada em", cell: (c) => formatDateTime(c.createdAt) },
            ]}
          />
        </>
      )}
    </div>
  );
}
