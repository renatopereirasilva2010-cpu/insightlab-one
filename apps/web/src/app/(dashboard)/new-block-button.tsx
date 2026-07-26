"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { BlockForm } from "./block-form";
import type { Professional, OperationalResource } from "@/lib/api-types";

export function NewBlockButton({
  professionals,
  resources,
}: {
  professionals: Professional[];
  resources: OperationalResource[];
}) {
  return (
    <EntityDialog
      title="Novo bloqueio"
      description="Bloqueie um horário para um profissional e/ou recurso."
      trigger={
        <Button>
          <Plus />
          Novo bloqueio
        </Button>
      }
    >
      {({ close }) => (
        <BlockForm professionals={professionals} resources={resources} onSuccess={close} />
      )}
    </EntityDialog>
  );
}
