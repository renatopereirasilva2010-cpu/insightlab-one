import { PackageX } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import type { Product } from "@/lib/api-types";
import { ExportCsvButton } from "../../painel/export-button";
import { NoReportAccess } from "../no-report-access";

export default async function EstoqueReportPage() {
  const user = await verifySession();
  if (!hasPermission(user, "reports.inventory.read")) return <NoReportAccess />;

  const { items: products } = await safeList<Product>("/v1/products");

  const lowStock = products
    .filter((p) => p.status === "ACTIVE" && p.stockQuantity !== null && p.minStock !== null)
    .filter((p) => Number(p.stockQuantity) <= Number(p.minStock))
    .sort((a, b) => Number(a.stockQuantity) - Number(b.stockQuantity));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <PackageX className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Estoque baixo</h1>
          <p className="text-muted-foreground text-sm">
            {lowStock.length} produto(s) no ou abaixo do estoque mínimo, agora.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <ExportCsvButton
          rows={lowStock.map((p) => ({
            produto: p.name,
            sku: p.sku ?? "",
            estoque: Number(p.stockQuantity),
            "estoque mínimo": Number(p.minStock),
          }))}
          filename="estoque-baixo.csv"
          label="Exportar CSV"
        />
      </div>
      <DataTable
        rows={lowStock}
        rowKey={(p) => p.id}
        emptyMessage="Nenhum produto abaixo do estoque mínimo. 🎉"
        columns={[
          { header: "Produto", cell: (p) => p.name },
          { header: "SKU", cell: (p) => p.sku ?? "—" },
          { header: "Estoque atual", cell: (p) => Number(p.stockQuantity) },
          { header: "Estoque mínimo", cell: (p) => Number(p.minStock) },
        ]}
      />
    </div>
  );
}
