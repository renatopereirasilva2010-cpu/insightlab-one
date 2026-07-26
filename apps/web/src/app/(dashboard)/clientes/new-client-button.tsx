"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { ClientForm } from "./client-form";

export function NewClientButton() {
  return (
    <EntityDialog
      title="Novo cliente"
      description="Cadastre um cliente para agendar e vender para ele."
      trigger={
        <Button>
          <Plus />
          Novo cliente
        </Button>
      }
    >
      {({ close }) => <ClientForm onSuccess={close} />}
    </EntityDialog>
  );
}
