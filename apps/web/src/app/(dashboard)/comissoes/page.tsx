import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { EntityAvatar } from "@/components/entity-avatar";
import {
  StatusBadge,
  commissionStatusLabels,
  commissionStatusVariants,
  payoutStatusLabels,
  payoutStatusVariants,
  payoutMethodLabels,
} from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type {
  Commission,
  CommissionPayout,
  Sale,
  Professional,
  Client,
  ServiceCatalogItem,
  Product,
} from "@/lib/api-types";
import { NewCommissionButton } from "./new-commission-button";
import { CommissionRowActions } from "./commission-row-actions";
import { PayoutRowActions } from "./payout-row-actions";

export default async function ComissoesPage() {
  const user = await verifySession();

  const [
    { items: commissions, error },
    { items: sales },
    { items: professionals },
    { items: clients },
    { items: services },
    { items: products },
    { items: payouts },
  ] = await Promise.all([
    safeList<Commission>("/v1/commissions"),
    safeList<Sale>("/v1/sales"),
    safeList<Professional>("/v1/professionals"),
    safeList<Client>("/v1/clients"),
    safeList<ServiceCatalogItem>("/v1/services-catalog"),
    safeList<Product>("/v1/products"),
    hasPermission(user, "commission-payouts.read")
      ? safeList<CommissionPayout>("/v1/commissions/payouts")
      : Promise.resolve({ items: [] as CommissionPayout[], error: undefined }),
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
            cell: (c) => {
              const prof = professionalById.get(c.professionalId);
              return prof ? (
                <span className="flex items-center gap-2">
                  <EntityAvatar name={prof.name} photoUrl={prof.photoUrl} />
                  {prof.name}
                </span>
              ) : (
                "—"
              );
            },
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

      {hasPermission(user, "commission-payouts.read") && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Repasses aos profissionais</h2>
            <p className="text-muted-foreground text-sm">
              Estrutura de repasse gerada automaticamente quando a comissão é liberada. Hoje o
              pagamento é feito manualmente (PIX) e marcado aqui até a integração automática de split
              de pagamento entrar no ar.
            </p>
          </div>

          <DataTable<CommissionPayout>
            rows={payouts}
            rowKey={(p) => p.id}
            emptyMessage="Nenhum repasse gerado ainda."
            columns={[
              {
                header: "Profissional",
                cell: (p) => p.professional?.name ?? professionalById.get(p.professionalId)?.name ?? "—",
              },
              { header: "Valor", cell: (p) => formatCurrency(p.amount) },
              { header: "Método", cell: (p) => payoutMethodLabels[p.method] ?? p.method },
              {
                header: "Status",
                cell: (p) => (
                  <StatusBadge status={p.status} labels={payoutStatusLabels} variants={payoutStatusVariants} />
                ),
              },
              { header: "Criado em", cell: (p) => formatDateTime(p.createdAt) },
              {
                header: "",
                className: "text-right",
                cell: (p) =>
                  hasPermission(user, "commission-payouts.update") ? (
                    <PayoutRowActions payout={p} />
                  ) : null,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
