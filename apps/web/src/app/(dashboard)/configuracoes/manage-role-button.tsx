"use client";

import { Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { Permission, Role, UserListItem } from "@/lib/api-types";
import { RoleAssignmentsForm } from "./role-assignments-form";

export function ManageRoleButton({
  role,
  permissions,
  users,
}: {
  role: Role;
  permissions: Permission[];
  users: UserListItem[];
}) {
  return (
    <EntityDialog
      title={`Papel: ${role.name}`}
      description="Atribua permissões e usuários a este papel."
      trigger={
        <Button variant="ghost" size="sm" title="Gerenciar">
          <Users2 />
        </Button>
      }
    >
      {({ close }) => (
        <RoleAssignmentsForm role={role} permissions={permissions} users={users} onSuccess={close} />
      )}
    </EntityDialog>
  );
}
