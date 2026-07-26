"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { ServiceForm } from "./service-form";

export function NewServiceButton() {
  return (
    <EntityDialog
      title="Novo serviço"
      description="Cadastre um serviço do catálogo, com preço e duração padrão."
      trigger={
        <Button>
          <Plus />
          Novo serviço
        </Button>
      }
    >
      {({ close }) => <ServiceForm onSuccess={close} />}
    </EntityDialog>
  );
}
