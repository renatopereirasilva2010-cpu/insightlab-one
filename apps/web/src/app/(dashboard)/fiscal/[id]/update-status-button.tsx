"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { FiscalStatusForm } from "./status-form";

export function UpdateStatusButton({
  documentId,
  currentStatus,
}: {
  documentId: string;
  currentStatus: string;
}) {
  return (
    <EntityDialog
      title="Atualizar status do documento"
      trigger={
        <Button size="sm">
          <Pencil />
          Atualizar status
        </Button>
      }
    >
      {({ close }) => (
        <FiscalStatusForm documentId={documentId} currentStatus={currentStatus} onSuccess={close} />
      )}
    </EntityDialog>
  );
}
