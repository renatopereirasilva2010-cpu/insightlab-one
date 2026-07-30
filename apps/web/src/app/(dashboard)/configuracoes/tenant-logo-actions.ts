"use server";

import { revalidatePath } from "next/cache";
import { apiFetchForm } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function uploadTenantLogo(tenantId: string, formData: FormData): Promise<ActionResult<unknown>> {
  const result = await runAction(() => apiFetchForm(`/v1/tenants/${tenantId}/logo`, formData));

  if (result.ok) revalidatePath("/", "layout");
  return result;
}
