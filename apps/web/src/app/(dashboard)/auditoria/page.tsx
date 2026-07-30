import { History } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

interface AuditLogEntry {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  createdAt: string;
  user: { name: string; email: string } | null;
}

interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchAuditLogs(page: number, entity?: string): Promise<AuditLogPage | null> {
  const params = new URLSearchParams({ page: String(page), pageSize: "30" });
  if (entity) params.set("entity", entity);
  try {
    return await apiFetch<AuditLogPage>(`/v1/audit-logs?${params.toString()}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return null;
    throw err;
  }
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  const user = await verifySession();
  const { page: pageParam, entity } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  if (!hasPermission(user, "audit.read")) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-10 text-center">
        <p className="text-sm font-medium">Você não tem permissão para ver a trilha de auditoria.</p>
      </div>
    );
  }

  const result = await fetchAuditLogs(page, entity);
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const pageSize = result?.pageSize ?? 30;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Auditoria</h1>
          <p className="text-muted-foreground text-sm">
            Quem fez o quê, quando — só leitura. {total} registro(s) no total.
          </p>
        </div>
      </div>

      <DataTable<AuditLogEntry>
        rows={items}
        rowKey={(e) => e.id}
        emptyMessage="Nenhum registro de auditoria encontrado."
        columns={[
          { header: "Quando", cell: (e) => formatDateTime(e.createdAt) },
          { header: "Usuário", cell: (e) => e.user?.name ?? "Sistema" },
          { header: "Ação", cell: (e) => e.action },
          { header: "Entidade", cell: (e) => e.entity },
          { header: "ID", cell: (e) => <span className="font-mono text-xs">{e.entityId}</span> },
        ]}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? (
                <a href={`/auditoria?page=${page - 1}${entity ? `&entity=${entity}` : ""}`}>Anterior</a>
              ) : (
                <span>Anterior</span>
              )}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? (
                <a href={`/auditoria?page=${page + 1}${entity ? `&entity=${entity}` : ""}`}>Próxima</a>
              ) : (
                <span>Próxima</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
