import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatusBadge, genericStatusLabels, genericStatusVariants } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/api-types";
import { NewProductButton } from "./new-product-button";

export default async function ProdutosPage() {
  const user = await verifySession();
  const { items: products, error } = await safeList<Product>("/v1/products");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-muted-foreground">Produtos disponíveis para venda avulsa.</p>
        </div>
        {hasPermission(user, "products.create") && <NewProductButton />}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<Product>
        rows={products}
        rowKey={(p) => p.id}
        emptyMessage="Nenhum produto cadastrado ainda."
        emptyAction={hasPermission(user, "products.create") ? <NewProductButton /> : undefined}
        columns={[
          { header: "Nome", cell: (p) => p.name },
          { header: "SKU", cell: (p) => p.sku ?? "—" },
          { header: "Preço", cell: (p) => formatCurrency(p.salePrice) },
          { header: "Custo", cell: (p) => (p.cost != null ? formatCurrency(p.cost) : "—") },
          {
            header: "Status",
            cell: (p) => (
              <StatusBadge
                status={p.status}
                labels={genericStatusLabels}
                variants={genericStatusVariants}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
