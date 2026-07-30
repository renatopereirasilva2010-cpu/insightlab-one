"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchForm } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { PixKeyType, Professional, UserListItem } from "@/lib/api-types";

export interface CreateProfessionalInput {
  name: string;
  socialName?: string;
  phone?: string;
  email?: string;
  roleTitle?: string;
  commissionRate?: number;
  payoutPixKey?: string;
  payoutPixKeyType?: PixKeyType;
}

export async function createProfessional(
  input: CreateProfessionalInput,
): Promise<ActionResult<Professional>> {
  const result = await runAction(() =>
    apiFetch<Professional>("/v1/professionals", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/profissionais");
  return result;
}

export interface UpdateProfessionalInput {
  name?: string;
  socialName?: string;
  phone?: string;
  email?: string;
  roleTitle?: string;
  commissionRate?: number;
  payoutPixKey?: string;
  payoutPixKeyType?: PixKeyType;
}

export async function updateProfessional(
  id: string,
  input: UpdateProfessionalInput,
): Promise<ActionResult<Professional>> {
  const result = await runAction(() =>
    apiFetch<Professional>(`/v1/professionals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/profissionais");
  return result;
}

export async function uploadProfessionalPhoto(
  id: string,
  formData: FormData,
): Promise<ActionResult<Professional>> {
  const result = await runAction(() =>
    apiFetchForm<Professional>(`/v1/professionals/${id}/photo`, formData),
  );

  if (result.ok) revalidatePath("/profissionais");
  return result;
}

export async function linkProfessionalAccount(
  userId: string,
  professionalId: string,
): Promise<ActionResult<UserListItem>> {
  const result = await runAction(() =>
    apiFetch<UserListItem>(`/v1/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ professionalId }),
    }),
  );

  if (result.ok) revalidatePath("/profissionais");
  return result;
}
