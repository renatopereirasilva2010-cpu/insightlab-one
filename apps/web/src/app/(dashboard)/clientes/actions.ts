"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchForm } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Client, ClientDeleteImpact, ClientDeleteResult } from "@/lib/api-types";

export interface CreateClientInput {
  name: string;
  phone?: string;
  email?: string;
  socialName?: string;
  source?: string;
}

export async function createClient(
  input: CreateClientInput,
  /**
   * revalidatePath aciona um refresh automático do Next.js na rota atual,
   * não só em /clientes - quando este action roda embutido em outro form
   * (ex.: "novo cliente" direto no agendamento), esse refresh reseta o
   * form pai (perde o clientId recém-selecionado). Quem já atualiza a
   * lista localmente via onSuccess não precisa dessa revalidação.
   */
  options?: { skipRevalidate?: boolean },
): Promise<ActionResult<Client>> {
  const result = await runAction(() =>
    apiFetch<Client>("/v1/clients", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok && !options?.skipRevalidate) revalidatePath("/clientes");
  return result;
}

export interface UpdateClientInput {
  name?: string;
  phone?: string;
  email?: string;
  socialName?: string;
  source?: string;
}

export async function updateClient(
  id: string,
  input: UpdateClientInput,
): Promise<ActionResult<Client>> {
  const result = await runAction(() =>
    apiFetch<Client>(`/v1/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) {
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
  }
  return result;
}

export async function uploadClientPhoto(id: string, formData: FormData): Promise<ActionResult<Client>> {
  const result = await runAction(() => apiFetchForm<Client>(`/v1/clients/${id}/photo`, formData));

  if (result.ok) {
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
  }
  return result;
}

export async function getClientDeleteImpact(id: string): Promise<ActionResult<ClientDeleteImpact>> {
  return runAction(() => apiFetch<ClientDeleteImpact>(`/v1/clients/${id}/delete-impact`));
}

export async function deleteClient(id: string): Promise<ActionResult<ClientDeleteResult>> {
  const result = await runAction(() =>
    apiFetch<ClientDeleteResult>(`/v1/clients/${id}`, { method: "DELETE" }),
  );

  if (result.ok) {
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
  }
  return result;
}
