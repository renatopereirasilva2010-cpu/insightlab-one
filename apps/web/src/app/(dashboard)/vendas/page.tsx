import Link from "next/link";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatusBadge, saleStatusLabels, saleStatusVariants } from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { Sale, Client, Professional } from "@/lib/api-types";
import { NewSaleButton } from "./new-sale-button";

export default async function VendasPage() {
  const user = await verifySession();

  const [
    { items: sales, error },
    { items: clients },
    { items: professionals },
  ] = await Promise.all([
    safeList<Sale>("/v1/sales"),
    safeList<Client>("/v1/clients"),
    safeList<Professional>("/v1/professionals"),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const professionalById = new Map(professionals.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendas</h1>
          <p className="text-muted-foreground">Vendas de serviços e produtos, do carrinho ao checkout.</p>
        </div>
        {hasPermission(user, "sales.create") && (
          <NewSaleButton clients={clients} professionals={professionals} />
        )}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<Sale>
        rows={sales}
        rowKey={(s) => s.id}
        emptyMessage="Nenhuma venda ainda."
        columns={[
          { header: "Cliente", cell: (s) => (s.clientId ? clientById.get(s.clientId)?.name ?? "—" : "—") },
          {
            header: "Profissional",
            cell: (s) => (s.professionalId ? professionalById.get(s.professionalId)?.name ?? "—" : "—"),
          },
          { header: "Itens", cell: (s) => s.items.length },
          { header: "Total", cell: (s) => formatCurrency(s.totalAmount) },
          {
            header: "Status",
            cell: (s) => (
              <StatusBadge status={s.status} labels={saleStatusLabels} variants={saleStatusVariants} />
            ),
          },
          { header: "Criada em", cell: (s) => formatDateTime(s.createdAt) },
          {
            header: "",
            className: "text-right",
            cell: (s) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/vendas/${s.id}`}>Abrir</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
