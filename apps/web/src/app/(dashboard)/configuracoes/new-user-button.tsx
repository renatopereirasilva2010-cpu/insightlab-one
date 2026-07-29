"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { UserForm } from "./user-form";

export function NewUserButton() {
  return (
    <EntityDialog
      title="Novo usuário"
      description="Crie uma conta de acesso ao sistema. Atribua um papel depois, na aba Papéis."
      trigger={
        <Button>
          <Plus />
          Novo usuário
        </Button>
      }
    >
      {({ close }) => <UserForm onSuccess={close} />}
    </EntityDialog>
  );
}
