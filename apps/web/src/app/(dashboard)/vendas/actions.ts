"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Sale, SaleItem, Payment } from "@/lib/api-types";

export interface CreateSaleInput {
  attendanceId?: string;
  clientId: string;
  professionalId?: string;
  notes?: string;
}

export async function createSale(input: CreateSaleInput): Promise<ActionResult<Sale>> {
  const result = await runAction(() =>
    apiFetch<Sale>("/v1/sales", { method: "POST", body: JSON.stringify(input) }),
  );
  if (result.ok) revalidatePath("/vendas");
  return result;
}

export interface AddSaleItemInput {
  itemType: "SERVICE" | "PRODUCT";
  serviceId?: string;
  productId?: string;
  professionalId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export async function addSaleItem(
  saleId: string,
  input: AddSaleItemInput,
): Promise<ActionResult<SaleItem>> {
  const result = await runAction(async () => {
    const item = await apiFetch<SaleItem>(`/v1/sales/${saleId}/items`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    // O POST de item não devolve a Sale com totais recalculados - força o
    // recalculo aqui pra garantir consistência antes de revalidar a página.
    await apiFetch<Sale>(`/v1/sales/${saleId}/recalculate`, { method: "POST" });
    return item;
  });
  if (result.ok) revalidatePath(`/vendas/${saleId}`);
  return result;
}

export async function recalculateSale(saleId: string): Promise<ActionResult<Sale>> {
  const result = await runAction(() =>
    apiFetch<Sale>(`/v1/sales/${saleId}/recalculate`, { method: "POST" }),
  );
  if (result.ok) revalidatePath(`/vendas/${saleId}`);
  return result;
}

export async function readyForCheckout(saleId: string): Promise<ActionResult<Sale>> {
  const result = await runAction(() =>
    apiFetch<Sale>(`/v1/sales/${saleId}/ready-for-checkout`, { method: "POST" }),
  );
  if (result.ok) revalidatePath(`/vendas/${saleId}`);
  return result;
}

export async function cancelSale(saleId: string): Promise<ActionResult<Sale>> {
  const result = await runAction(() =>
    apiFetch<Sale>(`/v1/sales/${saleId}/cancel`, { method: "POST" }),
  );
  if (result.ok) revalidatePath(`/vendas/${saleId}`);
  return result;
}

export interface CreatePaymentInput {
  saleId: string;
  method: "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "DEFERRED";
  amount: number;
  cashRegisterId: string;
  isDeferred?: boolean;
  deferredDueDate?: string;
  externalReference?: string;
  notes?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<ActionResult<Payment>> {
  const result = await runAction(() =>
    apiFetch<Payment>("/v1/payments", { method: "POST", body: JSON.stringify(input) }),
  );
  if (result.ok) {
    revalidatePath(`/vendas/${input.saleId}`);
    revalidatePath("/painel");
  }
  return result;
}
