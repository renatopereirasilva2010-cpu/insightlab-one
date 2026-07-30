"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { CashRegister } from "@/lib/api-types";

export interface OpenCashRegisterInput {
  name: string;
  openingBalance?: number;
  notes?: string;
}

export async function openCashRegister(
  input: OpenCashRegisterInput,
): Promise<ActionResult<CashRegister>> {
  const result = await runAction(() =>
    apiFetch<CashRegister>("/v1/cash-register/open", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) {
    revalidatePath("/caixa");
    revalidatePath("/painel");
  }
  return result;
}

export interface CloseCashRegisterInput {
  closingBalance?: number;
  notes?: string;
}

export async function closeCashRegister(
  id: string,
  input: CloseCashRegisterInput,
): Promise<ActionResult<CashRegister>> {
  const result = await runAction(() =>
    apiFetch<CashRegister>(`/v1/cash-register/${id}/close`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) {
    revalidatePath("/caixa");
    revalidatePath("/painel");
  }
  return result;
}
