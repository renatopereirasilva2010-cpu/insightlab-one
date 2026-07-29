"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { DataSubjectRequest } from "@/lib/api-types";
import { ResolveRequestForm } from "./resolve-request-form";

export function RequestRowActions({ request }: { request: DataSubjectRequest }) {
  return (
    <EntityDialog
      title="Solicitação de titular de dados"
      description="Atualize o status e registre como a solicitação foi tratada."
      trigger={
        <Button variant="ghost" size="sm" title="Tratar solicitação">
          <Pencil />
        </Button>
      }
    >
      {({ close }) => <ResolveRequestForm request={request} onSuccess={close} />}
    </EntityDialog>
  );
}
