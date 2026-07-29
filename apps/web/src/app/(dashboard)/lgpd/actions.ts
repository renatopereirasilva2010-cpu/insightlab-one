"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { DataSubjectRequest, DataSubjectRequestStatus, OwnConsentStatus } from "@/lib/api-types";

export interface UpdateDataSubjectRequestInput {
  status: DataSubjectRequestStatus;
  resolutionNotes?: string;
}

export async function updateDataSubjectRequest(
  id: string,
  input: UpdateDataSubjectRequestInput,
): Promise<ActionResult<DataSubjectRequest>> {
  const result = await runAction(() =>
    apiFetch<DataSubjectRequest>(`/v1/legal/data-subject-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/lgpd");
  return result;
}

export async function fetchOwnConsentStatus(): Promise<ActionResult<OwnConsentStatus>> {
  return runAction(() => apiFetch<OwnConsentStatus>("/v1/legal/consents/me"));
}

export async function acceptOwnConsent(
  type: "TERMS_OF_USE" | "PRIVACY_POLICY",
): Promise<ActionResult<{ accepted: boolean }>> {
  const result = await runAction(() =>
    apiFetch<{ accepted: boolean }>("/v1/legal/consents", {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  );
  return result;
}
