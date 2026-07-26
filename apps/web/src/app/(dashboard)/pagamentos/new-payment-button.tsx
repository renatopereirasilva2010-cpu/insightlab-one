"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { CreatePaymentForm } from "./create-payment-form";
import type { Sale, Client } from "@/lib/api-types";

export function NewPaymentButton({
  eligibleSales,
  clients,
}: {
  eligibleSales: Sale[];
  clients: Client[];
}) {
  return (
    <EntityDialog
      title="Novo pagamento"
      description="Registre um pagamento para uma venda aberta ou pronta para checkout."
      trigger={
        <Button>
          <Plus />
          Novo pagamento
        </Button>
      }
    >
      {({ close }) => (
        <CreatePaymentForm eligibleSales={eligibleSales} clients={clients} onSuccess={close} />
      )}
    </EntityDialog>
  );
}
