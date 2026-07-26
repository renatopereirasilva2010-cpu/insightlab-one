"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { SaleForm } from "./sale-form";
import type { Client, Professional } from "@/lib/api-types";

export function NewSaleButton({
  clients,
  professionals,
}: {
  clients: Client[];
  professionals: Professional[];
}) {
  const router = useRouter();

  return (
    <EntityDialog
      title="Nova venda"
      description="Abra uma venda para adicionar serviços e produtos."
      trigger={
        <Button>
          <Plus />
          Nova venda
        </Button>
      }
    >
      {({ close }) => (
        <SaleForm
          clients={clients}
          professionals={professionals}
          onSuccess={(saleId) => {
            close();
            router.push(`/vendas/${saleId}`);
          }}
        />
      )}
    </EntityDialog>
  );
}
