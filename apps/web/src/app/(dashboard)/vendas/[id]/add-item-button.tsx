"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { SaleItemForm } from "./sale-item-form";
import type { ServiceCatalogItem, Product } from "@/lib/api-types";

export function AddItemButton({
  saleId,
  services,
  products,
}: {
  saleId: string;
  services: ServiceCatalogItem[];
  products: Product[];
}) {
  return (
    <EntityDialog
      title="Adicionar item"
      description="Adicione um serviço ou produto a esta venda."
      trigger={
        <Button size="sm">
          <Plus />
          Adicionar item
        </Button>
      }
    >
      {({ close }) => (
        <SaleItemForm saleId={saleId} services={services} products={products} onSuccess={close} />
      )}
    </EntityDialog>
  );
}
