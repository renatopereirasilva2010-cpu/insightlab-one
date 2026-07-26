"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { CloseCashRegisterForm } from "./close-form";

export function CloseRegisterButton({ registerId }: { registerId: string }) {
  return (
    <EntityDialog
      title="Fechar caixa"
      description="Informe o saldo final antes de fechar o caixa."
      trigger={
        <Button variant="outline" size="sm">
          <Lock />
          Fechar
        </Button>
      }
    >
      {({ close }) => <CloseCashRegisterForm registerId={registerId} onSuccess={close} />}
    </EntityDialog>
  );
}
