import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatusBadge, genericStatusLabels, genericStatusVariants } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import type { ServiceCatalogItem } from "@/lib/api-types";
import { NewServiceButton } from "./new-service-button";
import { EditFiscalButton } from "./edit-fiscal-button";
import { EditServiceButton } from "./edit-service-button";

export default async function ServicosPage() {
  const user = await verifySession();
  const { items: services, error } = await safeList<ServiceCatalogItem>("/v1/services-catalog");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Serviços</h1>
          <p className="text-muted-foreground">
            Catálogo de serviços oferecidos, com duração, preço e dados fiscais.
          </p>
        </div>
        {hasPermission(user, "services.create") && <NewServiceButton />}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<ServiceCatalogItem>
        rows={services}
        rowKey={(s) => s.id}
        emptyMessage="Nenhum serviço cadastrado ainda."
        emptyAction={hasPermission(user, "services.create") ? <NewServiceButton /> : undefined}
        columns={[
          { header: "Nome", cell: (s) => s.name },
          { header: "Duração", cell: (s) => `${s.durationMinutes} min` },
          { header: "Preço", cell: (s) => formatCurrency(s.price) },
          { header: "CNAE", cell: (s) => s.cnaeCode ?? "—" },
          {
            header: "Status",
            cell: (s) => (
              <StatusBadge
                status={s.status}
                labels={genericStatusLabels}
                variants={genericStatusVariants}
              />
            ),
          },
          {
            header: "",
            className: "text-right",
            cell: (s) =>
              hasPermission(user, "services.update") ? (
                <div className="flex justify-end gap-1">
                  <EditServiceButton service={s} />
                  <EditFiscalButton service={s} />
                </div>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
