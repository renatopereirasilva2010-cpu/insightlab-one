"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { BusinessSettings } from "@/lib/api-types";
import { SettingsForm } from "./settings-form";

export function EditSettingsButton({ settings }: { settings: BusinessSettings }) {
  return (
    <EntityDialog
      title="Editar configurações"
      description="Parâmetros do negócio, visíveis apenas a quem tem permissão de administrar."
      trigger={
        <Button variant="outline" size="sm">
          <Pencil />
          Editar
        </Button>
      }
    >
      {({ close }) => <SettingsForm settings={settings} onSuccess={close} />}
    </EntityDialog>
  );
}
