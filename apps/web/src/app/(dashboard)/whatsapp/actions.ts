"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { WhatsAppMessage } from "@/lib/api-types";

export async function resendWhatsAppMessage(id: string): Promise<ActionResult<WhatsAppMessage>> {
  const result = await runAction(() =>
    apiFetch<WhatsAppMessage>(`/v1/whatsapp/messages/${id}/resend`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/whatsapp");
  return result;
}
