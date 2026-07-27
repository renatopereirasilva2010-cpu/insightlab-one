"use client";

import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import { LinkAccountForm } from "./link-account-form";
import type { Professional, UserListItem } from "@/lib/api-types";

export function LinkAccountButton({
  professional,
  users,
}: {
  professional: Professional;
  users: UserListItem[];
}) {
  return (
    <EntityDialog
      title={`Conta de acesso - ${professional.name}`}
      description="Vincule este profissional a uma conta de login do sistema."
      trigger={
        <Button variant="outline" size="sm">
          <Link2 />
          Conta
        </Button>
      }
    >
      {({ close }) => (
        <LinkAccountForm professional={professional} users={users} onSuccess={close} />
      )}
    </EntityDialog>
  );
}
