"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { Product } from "@/lib/api-types";
import { ProductForm } from "./product-form";

export function EditProductButton({ product }: { product: Product }) {
  return (
    <EntityDialog
      title="Editar produto"
      description="Altere nome, SKU, preço de venda e custo deste produto."
      trigger={
        <Button variant="ghost" size="sm" title="Editar">
          <Pencil />
        </Button>
      }
    >
      {({ close }) => <ProductForm existing={product} onSuccess={close} />}
    </EntityDialog>
  );
}
