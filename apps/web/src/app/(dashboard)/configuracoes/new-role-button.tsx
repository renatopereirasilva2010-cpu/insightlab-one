"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { RoleForm } from "./role-form";

export function NewRoleButton() {
  return (
    <EntityDialog
      title="Novo papel"
      description="Crie um papel; depois atribua permissões e usuários a ele."
      trigger={
        <Button>
          <Plus />
          Novo papel
        </Button>
      }
    >
      {({ close }) => <RoleForm onSuccess={close} />}
    </EntityDialog>
  );
}
