"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
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
