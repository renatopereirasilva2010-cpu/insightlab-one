"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { SupplyForm } from "./supply-form";

export function NewSupplyButton() {
  return (
    <EntityDialog
      title="Novo insumo"
      description="Cadastre um insumo usado internamente (fracionável ou não)."
      trigger={
        <Button>
          <Plus />
          Novo insumo
        </Button>
      }
    >
      {({ close }) => <SupplyForm onSuccess={close} />}
    </EntityDialog>
  );
}
