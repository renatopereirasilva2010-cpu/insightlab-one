"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Client } from "@/lib/api-types";

export interface CreateClientInput {
  name: string;
  phone?: string;
  email?: string;
  socialName?: string;
  source?: string;
}

export async function createClient(
  input: CreateClientInput,
): Promise<ActionResult<Client>> {
  const result = await runAction(() =>
    apiFetch<Client>("/v1/clients", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/clientes");
  return result;
}
