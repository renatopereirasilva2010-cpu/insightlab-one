"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { UserListItem } from "@/lib/api-types";
import { UserForm } from "./user-form";

export function EditUserButton({ user }: { user: UserListItem }) {
  return (
    <EntityDialog
      title="Editar usuário"
      description="Altere nome e telefone. E-mail e senha não são editáveis por aqui."
      trigger={
        <Button variant="ghost" size="sm" title="Editar">
          <Pencil />
        </Button>
      }
    >
      {({ close }) => <UserForm existing={user} onSuccess={close} />}
    </EntityDialog>
  );
}
