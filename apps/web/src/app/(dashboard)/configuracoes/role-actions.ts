"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Role, UserListItem } from "@/lib/api-types";

export interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
}

export async function createRole(input: CreateRoleInput): Promise<ActionResult<Role>> {
  const result = await runAction(() =>
    apiFetch<Role>("/v1/roles", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}

export async function assignPermissionToRole(
  roleId: string,
  permissionCode: string,
): Promise<ActionResult<Role>> {
  const result = await runAction(() =>
    apiFetch<Role>(`/v1/roles/${roleId}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permissionCode }),
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}

export async function assignUserToRole(
  roleId: string,
  userId: string,
): Promise<ActionResult<UserListItem>> {
  const result = await runAction(() =>
    apiFetch<UserListItem>(`/v1/roles/${roleId}/users`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}
