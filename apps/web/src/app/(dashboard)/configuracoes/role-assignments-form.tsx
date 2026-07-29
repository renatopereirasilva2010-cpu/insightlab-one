"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Permission, Role, UserListItem } from "@/lib/api-types";
import { assignPermissionToRole, assignUserToRole } from "./role-actions";

export function RoleAssignmentsForm({
  role,
  permissions,
  users,
  onSuccess,
}: {
  role: Role;
  permissions: Permission[];
  users: UserListItem[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [permissionCode, setPermissionCode] = useState("");
  const [userId, setUserId] = useState("");
  const [isSubmittingPermission, setIsSubmittingPermission] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  async function handleAssignPermission() {
    if (!permissionCode) return;
    setIsSubmittingPermission(true);
    const result = await assignPermissionToRole(role.id, permissionCode);
    setIsSubmittingPermission(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Permissão atribuída ao papel.");
    setPermissionCode("");
    router.refresh();
  }

  async function handleAssignUser() {
    if (!userId) return;
    setIsSubmittingUser(true);
    const result = await assignUserToRole(role.id, userId);
    setIsSubmittingUser(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Usuário atribuído ao papel.");
    setUserId("");
    router.refresh();
    onSuccess();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Atribuir permissão</p>
        <div className="flex gap-2">
          <Select value={permissionCode} onValueChange={setPermissionCode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a permissão" />
            </SelectTrigger>
            <SelectContent>
              {permissions.map((p) => (
                <SelectItem key={p.id} value={p.code}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={!permissionCode || isSubmittingPermission}
            onClick={handleAssignPermission}
          >
            Atribuir
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Atribuir usuário</p>
        <div className="flex gap-2">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o usuário" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" disabled={!userId || isSubmittingUser} onClick={handleAssignUser}>
            Atribuir
          </Button>
        </div>
      </div>
    </div>
  );
}
