"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { GenerateCommissionForm } from "./generate-form";
import type { Sale, Professional, Client } from "@/lib/api-types";

export function NewCommissionButton({
  sales,
  professionals,
  clients,
}: {
  sales: Sale[];
  professionals: Professional[];
  clients: Client[];
}) {
  return (
    <EntityDialog
      title="Gerar comissão"
      description="Gere a comissão de um profissional para uma venda."
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
          onSuccess={close}
        />
      )}
    </EntityDialog>
  );
}
