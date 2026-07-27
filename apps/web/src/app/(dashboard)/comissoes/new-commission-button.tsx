"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { GenerateCommissionForm } from "./generate-form";
import type { Sale, Professional, Client, ServiceCatalogItem, Product } from "@/lib/api-types";

export function NewCommissionButton({
  sales,
  professionals,
  clients,
  services,
  products,
}: {
  sales: Sale[];
  professionals: Professional[];
  clients: Client[];
  services: ServiceCatalogItem[];
  products: Product[];
}) {
  return (
    <EntityDialog
      title="Gerar comissão"
      description="Gere a comissão do profissional responsável por um item de venda."
      trigger={
        <Button>
          <Plus />
          Gerar comissão
        </Button>
      }
    >
      {({ close }) => (
        <GenerateCommissionForm
          sales={sales}
          professionals={professionals}
          clients={clients}
          services={services}
          products={products}
          onSuccess={close}
        />
      )}
    </EntityDialog>
  );
}
