"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { ProfessionalForm } from "./professional-form";

export function NewProfessionalButton() {
  return (
    <EntityDialog
      title="Novo profissional"
      description="Cadastre um profissional para vincular a agendamentos e comissões."
      trigger={
        <Button>
          <Plus />
          Novo profissional
        </Button>
      }
    >
      {({ close }) => <ProfessionalForm onSuccess={close} />}
    </EntityDialog>
  );
}
