"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { ServiceCatalogItem } from "@/lib/api-types";

export interface CreateServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  cnaeCode?: string;
  serviceListItemCode?: string;
  issRate?: number;
  availableOnline?: boolean;
}

export async function createService(
  input: CreateServiceInput,
): Promise<ActionResult<ServiceCatalogItem>> {
  const result = await runAction(() =>
    apiFetch<ServiceCatalogItem>("/v1/services-catalog", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/servicos");
  return result;
}

export interface UpdateServiceFiscalInput {
  cnaeCode?: string;
  serviceListItemCode?: string;
  issRate?: number;
}

export async function updateServiceFiscal(
  id: string,
  input: UpdateServiceFiscalInput,
): Promise<ActionResult<ServiceCatalogItem>> {
  const result = await runAction(() =>
    apiFetch<ServiceCatalogItem>(`/v1/services-catalog/${id}/fiscal`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/servicos");
  return result;
}
