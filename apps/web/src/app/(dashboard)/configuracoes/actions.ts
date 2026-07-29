"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { BusinessSettings, CommissionReleaseMode } from "@/lib/api-types";

export interface UpdateBusinessSettingsInput {
  timezone?: string;
  currency?: string;
  cancelPolicyHours?: number;
  lateToleranceMinutes?: number;
  deferredPaymentLabel?: string;
  allowDeferredPayment?: boolean;
  commissionReleaseMode?: CommissionReleaseMode;
  allowCommissionManualRelease?: boolean;
  commissionReleaseAllowDeferred?: boolean;
}

export async function updateBusinessSettings(
  input: UpdateBusinessSettingsInput,
): Promise<ActionResult<BusinessSettings>> {
  const result = await runAction(() =>
    apiFetch<BusinessSettings>("/v1/business-settings", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/configuracoes");
  return result;
}
