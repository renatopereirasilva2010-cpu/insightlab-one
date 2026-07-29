"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { SupplyItem, SupplyMovement, SupplyMovementType } from "@/lib/api-types";

export interface CreateSupplyInput {
  name: string;
  baseUnit: string;
  operationalUnit?: string;
  unitCost?: number;
  initialStock?: number;
  minStock?: number;
}

export async function createSupply(input: CreateSupplyInput): Promise<ActionResult<SupplyItem>> {
  const result = await runAction(() =>
    apiFetch<SupplyItem>("/v1/supplies", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/estoque");
  return result;
}

export interface UpdateSupplyInput {
  name?: string;
  baseUnit?: string;
  operationalUnit?: string;
  unitCost?: number;
  minStock?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export async function updateSupply(
  id: string,
  input: UpdateSupplyInput,
): Promise<ActionResult<SupplyItem>> {
  const result = await runAction(() =>
    apiFetch<SupplyItem>(`/v1/supplies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/estoque");
  return result;
}

export interface RegisterSupplyMovementInput {
  type: SupplyMovementType;
  quantity: number;
  unit: string;
  reason?: string;
}

export async function registerSupplyMovement(
  supplyItemId: string,
  input: RegisterSupplyMovementInput,
): Promise<ActionResult<SupplyMovement>> {
  const result = await runAction(() =>
    apiFetch<SupplyMovement>(`/v1/supplies/${supplyItemId}/movements`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/estoque");
  return result;
}
