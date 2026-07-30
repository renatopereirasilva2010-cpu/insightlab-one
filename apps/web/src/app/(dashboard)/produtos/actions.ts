"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchForm } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Product } from "@/lib/api-types";

export interface CreateProductInput {
  name: string;
  sku?: string;
  salePrice: number;
  cost?: number;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
  const result = await runAction(() =>
    apiFetch<Product>("/v1/products", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/produtos");
  return result;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  salePrice?: number;
  cost?: number;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ActionResult<Product>> {
  const result = await runAction(() =>
    apiFetch<Product>(`/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/produtos");
  return result;
}

export async function uploadProductPhoto(id: string, formData: FormData): Promise<ActionResult<Product>> {
  const result = await runAction(() => apiFetchForm<Product>(`/v1/products/${id}/photo`, formData));

  if (result.ok) revalidatePath("/produtos");
  return result;
}
