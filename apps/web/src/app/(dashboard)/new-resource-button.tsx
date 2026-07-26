"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { ResourceForm } from "./resource-form";

export function NewResourceButton() {
  return (
    <EntityDialog
      title="Novo recurso"
      description="Cadastre uma sala, cadeira ou equipamento usado na agenda."
      trigger={
        <Button>
          <Plus />
          Novo recurso
        </Button>
      }
    >
      {({ close }) => <ResourceForm onSuccess={close} />}
    </EntityDialog>
  );
}
