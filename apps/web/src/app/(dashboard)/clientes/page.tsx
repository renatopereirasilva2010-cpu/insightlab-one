import Link from "next/link";
import { verifySession, hasPermission } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { EntityAvatar } from "@/components/entity-avatar";
import { StatusBadge, genericStatusLabels, genericStatusVariants } from "@/components/status-badge";
import { displayName, formatDate } from "@/lib/format";
import type { Client } from "@/lib/api-types";
import { NewClientButton } from "./new-client-button";
import { EditClientButton } from "./edit-client-button";
import { DeleteClientButton } from "./delete-client-button";

interface ClientPage {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 50;

async function fetchClients(page: number): Promise<{ page: ClientPage | null; error?: string }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  try {
    return { page: await apiFetch<ClientPage>(`/v1/clients?${params.toString()}`) };
  } catch (err) {
    if (err instanceof ApiError) return { page: null, error: err.message };
    throw err;
  }
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await verifySession();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const { page: result, error } = await fetchClients(page);
  const clients = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-muted-foreground">
            Cadastro de clientes para agenda e vendas. {total} cliente(s) no total.
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
          {
            header: "Nome",
            cell: (c) => (
              <Link href={`/clientes/${c.id}`} className="flex items-center gap-2 underline underline-offset-2">
                <EntityAvatar name={displayName(c)} photoUrl={c.photoUrl} />
                {displayName(c)}
              </Link>
            ),
          },
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
          {
            header: "",
            className: "text-right",
            cell: (c) => (
              <div className="flex justify-end gap-1">
                {hasPermission(user, "clients.update") ? <EditClientButton client={c} /> : null}
                {hasPermission(user, "clients.delete") ? <DeleteClientButton client={c} /> : null}
              </div>
            ),
          },
        ]}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? <a href={`/clientes?page=${page - 1}`}>Anterior</a> : <span>Anterior</span>}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? <a href={`/clientes?page=${page + 1}`}>Próxima</a> : <span>Próxima</span>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
