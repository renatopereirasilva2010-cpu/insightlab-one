"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Commission, CommissionPayout } from "@/lib/api-types";

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
  if (result.ok) {
    revalidatePath("/comissoes");
    revalidatePath("/painel");
  }
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

export interface MarkPayoutPaidInput {
  method?: "PIX" | "BANK_TRANSFER" | "MANUAL";
  providerReference?: string;
  notes?: string;
}

export async function markPayoutPaid(
  id: string,
  input: MarkPayoutPaidInput = {},
): Promise<ActionResult<CommissionPayout>> {
  const result = await runAction(() =>
    apiFetch<CommissionPayout>(`/v1/commissions/payouts/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/comissoes");
  return result;
}

export interface MarkPayoutFailedInput {
  errorCode?: string;
  errorMessage?: string;
}

export async function markPayoutFailed(
  id: string,
  input: MarkPayoutFailedInput = {},
): Promise<ActionResult<CommissionPayout>> {
  const result = await runAction(() =>
    apiFetch<CommissionPayout>(`/v1/commissions/payouts/${id}/mark-failed`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/comissoes");
  return result;
}
