"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { ServiceCatalogItem } from "@/lib/api-types";
import { ServiceForm } from "./service-form";

export function EditServiceButton({ service }: { service: ServiceCatalogItem }) {
  return (
    <EntityDialog
      title="Editar serviço"
      description="Altere nome, descrição, duração, preço e disponibilidade online."
      trigger={
        <Button variant="ghost" size="sm" title="Editar">
          <Pencil />
        </Button>
      }
    >
      {({ close }) => <ServiceForm existing={service} onSuccess={close} />}
    </EntityDialog>
  );
}
