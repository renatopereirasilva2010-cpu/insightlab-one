"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchForm } from "@/lib/api";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { MigrationJob, ClientImportAnalysis, ClientImportCommitResult } from "@/lib/api-types";

/** Cria o job de migração que agrupa a análise + o commit de uma importação. */
export async function createImportJob(sourceType: "CSV" | "XLSX"): Promise<ActionResult<MigrationJob>> {
  return runAction(() =>
    apiFetch<MigrationJob>("/v1/admin-master/migration-jobs", {
      method: "POST",
      body: JSON.stringify({ sourceType }),
    }),
  );
}

export async function analyzeClientImport(
  jobId: string,
  formData: FormData,
): Promise<ActionResult<ClientImportAnalysis>> {
  return runAction(() =>
    apiFetchForm<ClientImportAnalysis>(`/v1/admin-master/migration-jobs/${jobId}/analyze`, formData),
  );
}

export interface CommitClientImportInput {
  fileToken: string;
  nameColumn?: string;
  phoneColumn?: string;
  emailColumn?: string;
  sourceColumn?: string;
  acceptedRowIndexes: number[];
}

export async function commitClientImport(
  jobId: string,
  input: CommitClientImportInput,
): Promise<ActionResult<ClientImportCommitResult>> {
  const result = await runAction(() =>
    apiFetch<ClientImportCommitResult>(`/v1/admin-master/migration-jobs/${jobId}/commit`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

  if (result.ok) revalidatePath("/clientes");
  return result;
}
