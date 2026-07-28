"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type {
  Appointment,
  AppointmentBlock,
  ProfessionalAvailability,
  OperationalResource,
} from "@/lib/api-types";

export interface CreateAppointmentInput {
  clientId: string;
  professionalId?: string;
  serviceId: string;
  resourceId?: string;
  startAt: string;
  endAt: string;
  isWalkIn?: boolean;
  isOverbook?: boolean;
  notes?: string;
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<ActionResult<Appointment>> {
  const result = await runAction(() =>
    apiFetch<Appointment>("/v1/appointments", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/");
  return result;
}

export async function cancelAppointment(
  id: string,
  reason?: string,
): Promise<ActionResult<Appointment>> {
  const result = await runAction(() =>
    apiFetch<Appointment>(`/v1/appointments/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
  if (result.ok) revalidatePath("/");
  return result;
}

export async function markAppointmentNoShow(id: string): Promise<ActionResult<Appointment>> {
  const result = await runAction(() =>
    apiFetch<Appointment>(`/v1/appointments/${id}/no-show`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/");
  return result;
}

export interface CreateAppointmentBlockInput {
  professionalId?: string;
  resourceId?: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
}

export async function createAppointmentBlock(
  input: CreateAppointmentBlockInput,
): Promise<ActionResult<AppointmentBlock>> {
  const result = await runAction(() =>
    apiFetch<AppointmentBlock>("/v1/appointment-blocks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/");
  return result;
}

export async function queryAvailability(
  professionalId: string,
  date: string,
): Promise<ActionResult<{ date: string; weekday: number; rules: ProfessionalAvailability[] }>> {
  return runAction(() =>
    apiFetch(`/v1/availability?professionalId=${professionalId}&date=${date}`),
  );
}

export async function suggestAppointmentSlots(
  professionalId: string,
  serviceId: string,
): Promise<ActionResult<{ suggestions: { startAt: string; endAt: string }[] }>> {
  return runAction(() =>
    apiFetch(
      `/v1/availability/suggestions?professionalId=${professionalId}&serviceId=${serviceId}`,
    ),
  );
}

export interface CreateAvailabilityInput {
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  active?: boolean;
}

export async function createAvailability(
  input: CreateAvailabilityInput,
): Promise<ActionResult<ProfessionalAvailability>> {
  const result = await runAction(() =>
    apiFetch<ProfessionalAvailability>("/v1/availability", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/");
  return result;
}

export interface UpdateAvailabilityInput {
  weekday?: number;
  startTime?: string;
  endTime?: string;
  active?: boolean;
}

export async function updateAvailability(
  id: string,
  input: UpdateAvailabilityInput,
): Promise<ActionResult<ProfessionalAvailability>> {
  const result = await runAction(() =>
    apiFetch<ProfessionalAvailability>(`/v1/availability/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/");
  return result;
}

export interface CreateResourceInput {
  name: string;
  type: string;
  description?: string;
}

export async function createResource(
  input: CreateResourceInput,
): Promise<ActionResult<OperationalResource>> {
  const result = await runAction(() =>
    apiFetch<OperationalResource>("/v1/resources", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/");
  return result;
}
