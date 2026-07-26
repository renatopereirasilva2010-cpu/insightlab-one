"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { AttendanceForm } from "./attendance-form";
import type { Client, Professional, ServiceCatalogItem, Appointment } from "@/lib/api-types";

export function NewAttendanceButton({
  clients,
  professionals,
  services,
  appointments,
}: {
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  appointments: Appointment[];
}) {
  return (
    <EntityDialog
      title="Novo atendimento"
      description="Inicie um registro de atendimento, vinculado a um agendamento ou avulso."
      trigger={
        <Button>
          <Plus />
          Novo atendimento
        </Button>
      }
    >
      {({ close }) => (
        <AttendanceForm
          clients={clients}
          professionals={professionals}
          services={services}
          appointments={appointments}
          onSuccess={close}
        />
      )}
    </EntityDialog>
  );
}
