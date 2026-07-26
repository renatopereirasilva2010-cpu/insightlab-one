"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Attendance } from "@/lib/api-types";

export interface CreateAttendanceInput {
  appointmentId?: string;
  clientId: string;
  professionalId?: string;
  serviceId: string;
  notes?: string;
}

export async function createAttendance(
  input: CreateAttendanceInput,
): Promise<ActionResult<Attendance>> {
  const result = await runAction(() =>
    apiFetch<Attendance>("/v1/attendances", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/atendimentos");
  return result;
}

export async function startAttendance(id: string): Promise<ActionResult<Attendance>> {
  const result = await runAction(() =>
    apiFetch<Attendance>(`/v1/attendances/${id}/start`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/atendimentos");
  return result;
}

export async function finishAttendance(id: string): Promise<ActionResult<Attendance>> {
  const result = await runAction(() =>
    apiFetch<Attendance>(`/v1/attendances/${id}/finish`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/atendimentos");
  return result;
}

export async function cancelAttendance(
  id: string,
  reason?: string,
): Promise<ActionResult<Attendance>> {
  const result = await runAction(() =>
    apiFetch<Attendance>(`/v1/attendances/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
  if (result.ok) revalidatePath("/atendimentos");
  return result;
}
