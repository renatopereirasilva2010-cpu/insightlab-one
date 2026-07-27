import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatusBadge, genericStatusLabels, genericStatusVariants } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { Client } from "@/lib/api-types";
import { NewClientButton } from "./new-client-button";

export default async function ClientesPage() {
  const user = await verifySession();
  const { items: clients, error } = await safeList<Client>("/v1/clients");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-muted-foreground">
            Cadastro de clientes para agenda e vendas.
          </p>
        </div>
        {hasPermission(user, "clients.create") && <NewClientButton />}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<Client>
        rows={clients}
        rowKey={(c) => c.id}
        emptyMessage="Nenhum cliente cadastrado ainda."
        emptyAction={hasPermission(user, "clients.create") ? <NewClientButton /> : undefined}
        columns={[
          { header: "Nome", cell: (c) => c.name },
          { header: "Nome social", cell: (c) => c.socialName ?? "—" },
          { header: "Telefone", cell: (c) => c.phone ?? "—" },
          { header: "E-mail", cell: (c) => c.email ?? "—" },
          { header: "Origem", cell: (c) => c.source ?? "—" },
          {
            header: "Status",
            cell: (c) => (
              <StatusBadge
                status={c.status}
                labels={genericStatusLabels}
                variants={genericStatusVariants}
              />
            ),
          },
          { header: "Cadastrado em", cell: (c) => formatDate(c.createdAt) },
        ]}
      />
    </div>
  );
}
