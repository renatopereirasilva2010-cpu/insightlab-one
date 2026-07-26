"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { FiscalDocument } from "@/lib/api-types";

export interface CreateFiscalDocumentInput {
  sourceType: "SALE" | "PAYMENT" | "MANUAL";
  sourceId: string;
  documentType: "NFSE" | "NFE" | "NFCE" | "OTHER";
  provider?: string;
}

export async function createFiscalDocument(
  input: CreateFiscalDocumentInput,
): Promise<ActionResult<FiscalDocument>> {
  const result = await runAction(() =>
    apiFetch<FiscalDocument>("/v1/fiscal-documents", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) revalidatePath("/fiscal");
  return result;
}

export interface UpdateFiscalDocumentStatusInput {
  status: "REQUESTED" | "AUTHORIZED" | "FAILED" | "CANCELED";
  message?: string;
  referenceNumber?: string;
  accessKey?: string;
  errorCode?: string;
  errorMessage?: string;
}

export async function updateFiscalDocumentStatus(
  id: string,
  input: UpdateFiscalDocumentStatusInput,
): Promise<ActionResult<FiscalDocument>> {
  const result = await runAction(() =>
    apiFetch<FiscalDocument>(`/v1/fiscal-documents/${id}/status`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  if (result.ok) {
    revalidatePath("/fiscal");
    revalidatePath(`/fiscal/${id}`);
  }
  return result;
}
