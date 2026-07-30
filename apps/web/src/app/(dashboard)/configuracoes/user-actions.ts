"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { UserListItem } from "@/lib/api-types";

export interface CreateUserInput {
  name: string;
  socialName?: string;
  email: string;
  password: string;
  phone?: string;
}

export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<UserListItem>> {
  const result = await runAction(() =>
    apiFetch<UserListItem>("/v1/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}

export interface UpdateUserInput {
  name?: string;
  socialName?: string;
  phone?: string;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<ActionResult<UserListItem>> {
  const result = await runAction(() =>
    apiFetch<UserListItem>(`/v1/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}

export async function blockUser(id: string): Promise<ActionResult<UserListItem>> {
  const result = await runAction(() =>
    apiFetch<UserListItem>(`/v1/users/${id}/block`, {
      method: "POST",
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}
