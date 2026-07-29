"use server";

import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { PublicAvailabilityRule } from "./types";

export interface CreatePublicAppointmentInput {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  professionalId?: string;
  startAt: string;
  notes?: string;
  acceptedPrivacyPolicy: boolean;
}

export async function createPublicAppointment(
  tenantSlug: string,
  input: CreatePublicAppointmentInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(() =>
    apiFetch<{ id: string }>(`/v1/public/${tenantSlug}/appointments`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export interface CreateDataSubjectRequestInput {
  requesterName: string;
  requesterContact: string;
  requestType: "ACCESS" | "CORRECTION" | "DELETION" | "PORTABILITY" | "CONSENT_REVOCATION";
  description?: string;
}

export async function createDataSubjectRequest(
  tenantSlug: string,
  input: CreateDataSubjectRequestInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(() =>
    apiFetch<{ id: string }>(`/v1/legal/data-subject-requests/${tenantSlug}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function fetchPublicAvailability(
  tenantSlug: string,
  professionalId: string,
  weekday: number,
): Promise<ActionResult<{ rules: PublicAvailabilityRule[] }>> {
  return runAction(() =>
    apiFetch<{ rules: PublicAvailabilityRule[] }>(
      `/v1/public/${tenantSlug}/availability?professionalId=${professionalId}&weekday=${weekday}`,
    ),
  );
}
