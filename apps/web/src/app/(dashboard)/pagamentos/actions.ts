"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Payment } from "@/lib/api-types";

export async function markPaymentPaid(id: string): Promise<ActionResult<Payment>> {
  const result = await runAction(() =>
    apiFetch<Payment>(`/v1/payments/${id}/mark-paid`, { method: "POST" }),
  );
  if (result.ok) {
    revalidatePath("/pagamentos");
    revalidatePath("/painel");
  }
  return result;
}

export interface MarkFailedInput {
  errorCode?: string;
  errorMessage?: string;
}

export async function markPaymentFailed(
  id: string,
  input: MarkFailedInput,
): Promise<ActionResult<Payment>> {
  const result = await runAction(() =>
    apiFetch<Payment>(`/v1/payments/${id}/mark-failed`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/pagamentos");
  return result;
}

export async function cancelPayment(id: string): Promise<ActionResult<Payment>> {
  const result = await runAction(() =>
    apiFetch<Payment>(`/v1/payments/${id}/cancel`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/pagamentos");
  return result;
}
