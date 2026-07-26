"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { PaymentForm } from "./payment-form";
import type { CashRegister } from "@/lib/api-types";

export function NewPaymentButton({
  saleId,
  defaultAmount,
  openRegisters,
}: {
  saleId: string;
  defaultAmount: number;
  openRegisters: CashRegister[];
}) {
  return (
    <EntityDialog
      title="Registrar pagamento"
      description="Registre o pagamento desta venda (checkout)."
      trigger={
        <Button size="sm">
          <Plus />
          Registrar pagamento
        </Button>
      }
    >
      {({ close }) => (
        <PaymentForm
          saleId={saleId}
          defaultAmount={defaultAmount}
          openRegisters={openRegisters}
          onSuccess={close}
        />
      )}
    </EntityDialog>
  );
}
