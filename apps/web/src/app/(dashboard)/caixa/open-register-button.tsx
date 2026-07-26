"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { OpenCashRegisterForm } from "./open-form";

export function OpenRegisterButton() {
  return (
    <EntityDialog
      title="Abrir caixa"
      description="Abra um novo caixa para registrar pagamentos."
      trigger={
        <Button>
          <Plus />
          Abrir caixa
        </Button>
      }
    >
      {({ close }) => <OpenCashRegisterForm onSuccess={close} />}
    </EntityDialog>
  );
}
