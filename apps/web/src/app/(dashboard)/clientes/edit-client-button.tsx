"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { Client } from "@/lib/api-types";
import { ClientForm } from "./client-form";

export function EditClientButton({ client }: { client: Client }) {
  return (
    <EntityDialog
      title="Editar cliente"
      description="Altere os dados cadastrais deste cliente."
      trigger={
        <Button variant="ghost" size="sm" title="Editar">
          <Pencil />
        </Button>
      }
    >
      {({ close }) => <ClientForm existing={client} onSuccess={close} />}
    </EntityDialog>
  );
}
