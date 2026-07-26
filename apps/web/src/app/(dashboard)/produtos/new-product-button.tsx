"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { ProductForm } from "./product-form";

export function NewProductButton() {
  return (
    <EntityDialog
      title="Novo produto"
      description="Cadastre um produto para venda avulsa."
      trigger={
        <Button>
          <Plus />
          Novo produto
        </Button>
      }
    >
      {({ close }) => <ProductForm onSuccess={close} />}
    </EntityDialog>
  );
}
