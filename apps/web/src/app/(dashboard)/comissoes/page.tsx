import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  commissionStatusLabels,
  commissionStatusVariants,
} from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type {
  Commission,
  Sale,
  Professional,
  Client,
  ServiceCatalogItem,
  Product,
} from "@/lib/api-types";
import { NewCommissionButton } from "./new-commission-button";
import { CommissionRowActions } from "./commission-row-actions";

export default async function ComissoesPage() {
  const user = await verifySession();

  const [
    { items: commissions, error },
    { items: sales },
    { items: professionals },
    { items: clients },
    { items: services },
    { items: products },
  ] = await Promise.all([
    safeList<Commission>("/v1/commissions"),
    safeList<Sale>("/v1/sales"),
    safeList<Professional>("/v1/professionals"),
    safeList<Client>("/v1/clients"),
    safeList<ServiceCatalogItem>("/v1/services-catalog"),
    safeList<Product>("/v1/products"),
  ]);

  const professionalById = new Map(professionals.map((p) => [p.id, p]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const saleById = new Map(sales.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Comissões</h1>
          <p className="text-muted-foreground">Comissões de profissionais geradas por venda.</p>
        </div>
        {hasPermission(user, "commissions.generate") && (
          <NewCommissionButton
            sales={sales}
            professionals={professionals}
            clients={clients}
            services={services}
            products={products}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<Commission>
        rows={commissions}
        rowKey={(c) => c.id}
        emptyMessage="Nenhuma comissão gerada ainda."
        emptyAction={
          hasPermission(user, "commissions.generate") ? (
            <NewCommissionButton
              sales={sales}
              professionals={professionals}
              clients={clients}
              services={services}
              products={products}
            />
          ) : undefined
        }
        columns={[
          {
            header: "Profissional",
            cell: (c) => professionalById.get(c.professionalId)?.name ?? "—",
          },
          {
            header: "Cliente da venda",
            cell: (c) => {
              const sale = saleById.get(c.saleId);
              return (sale?.clientId && clientById.get(sale.clientId)?.name) || "—";
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
          {
            header: "",
            className: "text-right",
            cell: (c) =>
              hasPermission(user, "commissions.release") || hasPermission(user, "commissions.cancel") ? (
                <CommissionRowActions commission={c} />
              ) : null,
          },
        ]}
      />
    </div>
  );
}
