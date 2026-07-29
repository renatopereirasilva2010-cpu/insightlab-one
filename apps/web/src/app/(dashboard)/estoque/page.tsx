import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatusBadge, genericStatusLabels, genericStatusVariants } from "@/components/status-badge";
import type { SupplyItem } from "@/lib/api-types";
import { NewSupplyButton } from "./new-supply-button";
import { SupplyRowActions } from "./supply-row-actions";

function formatQuantity(value: number | null, unit: string): string {
  if (value === null) return "—";
  return `${value} ${unit}`;
}

function isLowStock(item: SupplyItem): boolean {
  if (item.stockQuantity === null || item.minStock === null) return false;
  return Number(item.stockQuantity) <= Number(item.minStock);
}

export default async function EstoquePage() {
  const user = await verifySession();
  const [{ items: supplies, error }, { items: lowStock }] = await Promise.all([
    safeList<SupplyItem>("/v1/supplies"),
    safeList<SupplyItem>("/v1/supplies/low-stock"),
  ]);

  const canUpdate = hasPermission(user, "supplies.update");
  const canRegisterMovement = hasPermission(user, "supplies.movements.create");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Estoque</h1>
          <p className="text-muted-foreground">
            Insumos de uso interno, com controle de entrada, saída e ajuste de estoque.
          </p>
        </div>
        {hasPermission(user, "supplies.create") && <NewSupplyButton />}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      {lowStock.length > 0 && (
        <div className="border-destructive/50 bg-destructive/5 rounded-md border p-3">
          <p className="text-sm font-medium">
            {lowStock.length} {lowStock.length === 1 ? "insumo está" : "insumos estão"} no estoque mínimo ou
            abaixo
          </p>
          <p className="text-muted-foreground text-sm">
            {lowStock.map((item) => item.name).join(", ")}
          </p>
        </div>
      )}

      <DataTable<SupplyItem>
        rows={supplies}
        rowKey={(s) => s.id}
        emptyMessage="Nenhum insumo cadastrado ainda."
        emptyAction={hasPermission(user, "supplies.create") ? <NewSupplyButton /> : undefined}
        columns={[
          { header: "Nome", cell: (s) => s.name },
          {
            header: "Unidades",
            cell: (s) => (s.operationalUnit ? `${s.baseUnit} / ${s.operationalUnit}` : s.baseUnit),
          },
          {
            header: "Estoque atual",
            cell: (s) => (
              <span className={isLowStock(s) ? "text-destructive font-medium" : undefined}>
                {formatQuantity(s.stockQuantity, s.baseUnit)}
              </span>
            ),
          },
          { header: "Estoque mínimo", cell: (s) => formatQuantity(s.minStock, s.baseUnit) },
          {
            header: "Status",
            cell: (s) => (
              <StatusBadge status={s.status} labels={genericStatusLabels} variants={genericStatusVariants} />
            ),
          },
          {
            header: "",
            className: "text-right",
            cell: (s) => (
              <SupplyRowActions
                supplyItem={s}
                canUpdate={canUpdate}
                canRegisterMovement={canRegisterMovement}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
