"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { ServiceFiscalForm } from "./service-fiscal-form";
import type { ServiceCatalogItem } from "@/lib/api-types";

export function EditFiscalButton({ service }: { service: ServiceCatalogItem }) {
  return (
    <EntityDialog
      title={`Dados fiscais - ${service.name}`}
      description="CNAE, item da lista de serviços e alíquota de ISS."
      trigger={
        <Button variant="outline" size="sm">
          <Receipt />
          Fiscal
        </Button>
      }
    >
      {({ close }) => <ServiceFiscalForm service={service} onSuccess={close} />}
    </EntityDialog>
  );
}
