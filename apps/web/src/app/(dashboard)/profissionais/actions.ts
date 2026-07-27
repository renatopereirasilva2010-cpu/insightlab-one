"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Professional } from "@/lib/api-types";

export interface CreateProfessionalInput {
  name: string;
  phone?: string;
  email?: string;
  roleTitle?: string;
  commissionRate?: number;
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
