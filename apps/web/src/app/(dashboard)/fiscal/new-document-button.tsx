"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { CreateFiscalDocumentForm } from "./create-form";
import type { Sale, Payment, Client } from "@/lib/api-types";

export function NewDocumentButton({
  sales,
  payments,
  clients,
}: {
  sales: Sale[];
  payments: Payment[];
  clients: Client[];
}) {
  return (
    <EntityDialog
      title="Novo documento fiscal"
      description="Emita uma nota a partir de uma venda ou pagamento real."
      trigger={
        <Button>
          <Plus />
          Novo documento
        </Button>
      }
    >
      {({ close }) => (
        <CreateFiscalDocumentForm sales={sales} payments={payments} clients={clients} onSuccess={close} />
      )}
    </EntityDialog>
  );
}
