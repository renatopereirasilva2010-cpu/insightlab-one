"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { Professional } from "@/lib/api-types";
import { ProfessionalForm } from "./professional-form";

export function EditProfessionalButton({ professional }: { professional: Professional }) {
  return (
    <EntityDialog
      title="Editar profissional"
      description="Altere os dados cadastrais e a chave PIX de repasse deste profissional."
      trigger={
        <Button variant="ghost" size="sm" title="Editar">
          <Pencil />
        </Button>
      }
    >
      {({ close }) => <ProfessionalForm existing={professional} onSuccess={close} />}
    </EntityDialog>
  );
}
