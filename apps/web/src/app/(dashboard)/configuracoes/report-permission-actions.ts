"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function grantReportPermission(
  roleId: string,
  permissionCode: string,
): Promise<ActionResult<unknown>> {
  const result = await runAction(() =>
    apiFetch(`/v1/roles/${roleId}/report-permissions`, {
      method: "POST",
      body: JSON.stringify({ permissionCode }),
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}

export async function revokeReportPermission(
  roleId: string,
  permissionCode: string,
): Promise<ActionResult<unknown>> {
  const result = await runAction(() =>
    apiFetch(`/v1/roles/${roleId}/report-permissions/${encodeURIComponent(permissionCode)}`, {
      method: "DELETE",
    }),
  );

  if (result.ok) revalidatePath("/configuracoes");
  return result;
}
