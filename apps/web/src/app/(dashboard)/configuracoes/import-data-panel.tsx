"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleCheck, CircleAlert, Copy, CircleX, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/data-table";
import type { ClientImportAnalysis, ClientImportRowStatus } from "@/lib/api-types";
import { createImportJob, analyzeClientImport, commitClientImport } from "./import-data-actions";

const STATUS_META: Record<ClientImportRowStatus, { label: string; className: string; icon: typeof CircleCheck }> = {
  IMPORTAVEL: { label: "Importável", className: "text-success border-success/30", icon: CircleCheck },
  PARCIAL: { label: "Parcial", className: "border-transparent", icon: CircleAlert },
  DUPLICADO: { label: "Duplicado", className: "text-muted-foreground", icon: Copy },
  NAO_IMPORTAVEL: { label: "Não importável", className: "text-danger border-danger/30", icon: CircleX },
};

const MAPPING_FIELDS = [
  { key: "nameColumn" as const, label: "Nome" },
  { key: "phoneColumn" as const, label: "Telefone" },
  { key: "emailColumn" as const, label: "E-mail" },
];

/**
 * Fluxo: escolher arquivo -> analisar (backend classifica cada linha, sem
 * escrever nada ainda) -> revisar/ajustar mapeamento e seleção -> confirmar
 * (só aí grava Client de verdade). Ver governance/insightlab-one-onda12-
 * import-dados-clientes.md pro racional completo.
 */
export function ImportDataPanel() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ClientImportAnalysis | null>(null);
  const [mapping, setMapping] = useState<{ nameColumn?: string; phoneColumn?: string; emailColumn?: string }>({});
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; skippedCount: number } | null>(null);

  async function runAnalysis(selectedFile: File, currentJobId: string, overrides: typeof mapping) {
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (overrides.nameColumn) formData.append("nameColumn", overrides.nameColumn);
    if (overrides.phoneColumn) formData.append("phoneColumn", overrides.phoneColumn);
    if (overrides.emailColumn) formData.append("emailColumn", overrides.emailColumn);

    const analyzed = await analyzeClientImport(currentJobId, formData);
    if (!analyzed.ok) {
      toast.error(analyzed.message ?? "Erro ao analisar o arquivo.");
      return;
    }

    setAnalysis(analyzed.data);
    setMapping({
      nameColumn: analyzed.data.mapping.name ?? undefined,
      phoneColumn: analyzed.data.mapping.phone ?? undefined,
      emailColumn: analyzed.data.mapping.email ?? undefined,
    });
    setAccepted(
      new Set(
        analyzed.data.rows
          .filter((r) => r.status === "IMPORTAVEL" || r.status === "PARCIAL")
          .map((r) => r.rowIndex),
      ),
    );
  }

  async function handleFileSelected(selectedFile: File) {
    setFile(selectedFile);
    setPending(true);
    setResult(null);

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const sourceType = ext === "csv" ? "CSV" : "XLSX";
    const job = await createImportJob(sourceType);
    if (!job.ok) {
      toast.error(job.message ?? "Erro ao iniciar a importação.");
      setPending(false);
      return;
    }
    setJobId(job.data.id);
    await runAnalysis(selectedFile, job.data.id, {});
    setPending(false);
  }

  async function handleReanalyze() {
    if (!file || !jobId) return;
    setPending(true);
    await runAnalysis(file, jobId, mapping);
    setPending(false);
  }

  async function handleCommit() {
    if (!jobId || !analysis) return;
    setPending(true);
    const commitResult = await commitClientImport(jobId, {
      fileToken: analysis.fileToken,
      ...mapping,
      acceptedRowIndexes: Array.from(accepted),
    });
    setPending(false);

    if (!commitResult.ok) {
      toast.error(commitResult.message ?? "Erro ao confirmar a importação.");
      return;
    }
    toast.success(`${commitResult.data.importedCount} cliente(s) importado(s).`);
    setResult({ importedCount: commitResult.data.importedCount, skippedCount: commitResult.data.skippedCount });
    router.refresh();
  }

  function reset() {
    setFile(null);
    setJobId(null);
    setAnalysis(null);
    setMapping({});
    setAccepted(new Set());
    setResult(null);
  }

  function toggleRow(rowIndex: number) {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importação concluída</CardTitle>
          <CardDescription>
            {result.importedCount} cliente(s) criado(s) em Clientes. {result.skippedCount} linha(s) não
            selecionada(s) foram ignoradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={reset}>
            Importar outro arquivo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importar clientes de outro sistema</CardTitle>
          <CardDescription>
            Envie um arquivo CSV, XLS ou XLSX. Nada é gravado ainda — a próxima tela mostra o que pode e o
            que não pode ser aproveitado, e por quê, antes de qualquer importação real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground hover:bg-muted/50">
            <Upload className="h-6 w-6" />
            {pending ? "Analisando..." : "Clique para escolher um arquivo (.csv, .xls, .xlsx)"}
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              disabled={pending}
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) void handleFileSelected(selected);
              }}
            />
          </label>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!analysis.recognized && (
        <p className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          Não foi possível identificar automaticamente as colunas de Nome/Telefone/E-mail neste arquivo —
          pode ser um relatório agregado (ex.: estatística, ranking), não um cadastro de clientes. Ajuste o
          mapeamento manualmente abaixo se souber quais colunas usar, ou envie outro arquivo.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mapeamento de colunas</CardTitle>
          <CardDescription>{file?.name} — colunas encontradas: {analysis.headers.join(", ")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {MAPPING_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm font-medium">{field.label}</label>
              <Select
                value={mapping[field.key] ?? "__none__"}
                onValueChange={(value) =>
                  setMapping((prev) => ({ ...prev, [field.key]: value === "__none__" ? undefined : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {analysis.headers
                    .filter((h) => h)
                    .map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
        <CardContent className="flex justify-end pt-0">
          <Button variant="outline" size="sm" disabled={pending} onClick={handleReanalyze}>
            Reanalisar com este mapeamento
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Importáveis" value={String(analysis.summary.importavel)} icon={CircleCheck} tone="success" />
        <StatCard label="Parciais (só nome)" value={String(analysis.summary.parcial)} icon={CircleAlert} tone="warning" />
        <StatCard label="Duplicados" value={String(analysis.summary.duplicado)} icon={Copy} tone="neutral" />
        <StatCard label="Não importáveis" value={String(analysis.summary.naoImportavel)} icon={CircleX} tone="danger" />
      </div>

      <DataTable
        rows={analysis.rows}
        rowKey={(r) => String(r.rowIndex)}
        emptyMessage="Nenhuma linha reconhecida neste arquivo."
        columns={[
          {
            header: "",
            className: "w-10",
            cell: (r) =>
              r.status === "NAO_IMPORTAVEL" ? null : (
                <Checkbox checked={accepted.has(r.rowIndex)} onCheckedChange={() => toggleRow(r.rowIndex)} />
              ),
          },
          { header: "Nome", cell: (r) => r.name ?? "—" },
          { header: "Telefone", cell: (r) => r.phone ?? "—" },
          { header: "E-mail", cell: (r) => r.email ?? "—" },
          {
            header: "Status",
            cell: (r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta.icon;
              return (
                <Badge variant="outline" className={meta.className}>
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </Badge>
              );
            },
          },
          { header: "Racional", className: "max-w-xs text-muted-foreground text-xs", cell: (r) => r.reason },
        ]}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={reset} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={handleCommit} disabled={pending || accepted.size === 0}>
          {pending ? "Importando..." : `Confirmar importação (${accepted.size})`}
        </Button>
      </div>
    </div>
  );
}
