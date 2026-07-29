"use client";

import { Pencil, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { SupplyItem } from "@/lib/api-types";
import { SupplyForm } from "./supply-form";
import { SupplyMovementForm } from "./supply-movement-form";

export function SupplyRowActions({
  supplyItem,
  canUpdate,
  canRegisterMovement,
}: {
  supplyItem: SupplyItem;
  canUpdate: boolean;
  canRegisterMovement: boolean;
}) {
  if (!canUpdate && !canRegisterMovement) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex justify-end gap-1">
      {canRegisterMovement && (
        <EntityDialog
          title="Registrar movimento"
          description={`Entrada, saída ou ajuste de estoque para "${supplyItem.name}".`}
          trigger={
            <Button variant="ghost" size="sm" title="Registrar movimento">
              <ArrowRightLeft />
            </Button>
          }
        >
          {({ close }) => <SupplyMovementForm supplyItem={supplyItem} onSuccess={close} />}
        </EntityDialog>
      )}

      {canUpdate && (
        <EntityDialog
          title="Editar insumo"
          description="Altere os dados cadastrais deste insumo."
          trigger={
            <Button variant="ghost" size="sm" title="Editar">
              <Pencil />
            </Button>
          }
        >
          {({ close }) => <SupplyForm existing={supplyItem} onSuccess={close} />}
        </EntityDialog>
      )}
    </div>
  );
}
