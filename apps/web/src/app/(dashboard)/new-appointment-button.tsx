"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { AppointmentForm } from "./appointment-form";
import type { Client, Professional, ServiceCatalogItem, OperationalResource } from "@/lib/api-types";

export function NewAppointmentButton({
  clients,
  professionals,
  services,
  resources,
}: {
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  resources: OperationalResource[];
}) {
  return (
    <EntityDialog
      title="Novo agendamento"
      description="Agende um horário para um cliente."
      trigger={
        <Button>
          <Plus />
          Novo agendamento
        </Button>
      }
    >
      {({ close }) => (
        <AppointmentForm
          clients={clients}
          professionals={professionals}
          services={services}
          resources={resources}
          onSuccess={close}
        />
      )}
    </EntityDialog>
  );
}
