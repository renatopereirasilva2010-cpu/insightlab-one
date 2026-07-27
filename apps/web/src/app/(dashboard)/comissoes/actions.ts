"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Commission } from "@/lib/api-types";

export interface GenerateCommissionInput {
  saleItemId: string;
  baseAmount: number;
  notes?: string;
}

export async function generateCommission(
  input: GenerateCommissionInput,
): Promise<ActionResult<Commission>> {
  const result = await runAction(() =>
    apiFetch<Commission>("/v1/commissions/generate", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/comissoes");
  return result;
}

export async function releaseCommission(id: string): Promise<ActionResult<Commission>> {
  const result = await runAction(() =>
    apiFetch<Commission>(`/v1/commissions/${id}/release`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/comissoes");
  return result;
}

export async function blockCommission(id: string): Promise<ActionResult<Commission>> {
  const result = await runAction(() =>
    apiFetch<Commission>(`/v1/commissions/${id}/block`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/comissoes");
  return result;
}

export async function cancelCommission(id: string): Promise<ActionResult<Commission>> {
  const result = await runAction(() =>
    apiFetch<Commission>(`/v1/commissions/${id}/cancel`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/comissoes");
  return result;
}
