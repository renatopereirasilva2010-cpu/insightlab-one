import { Wallet } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { formatCurrency } from "@/lib/format";
import type { Commission, Professional } from "@/lib/api-types";
import { RevenueBreakdownChart } from "../../painel/revenue-charts";
import { ExportCsvButton } from "../../painel/export-button";
import { DateRangeForm, parseDateRange } from "../date-range-form";
import { NoReportAccess } from "../no-report-access";

export default async function ComissoesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await verifySession();
  if (!hasPermission(user, "reports.commissions.read")) return <NoReportAccess />;

  const { from, to, fromDate, toDate } = parseDateRange(await searchParams, 30);

  const [{ items: commissions }, { items: professionals }] = await Promise.all([
    safeList<Commission>("/v1/commissions"),
    safeList<Professional>("/v1/professionals"),
  ]);

  const professionalById = new Map(professionals.map((p) => [p.id, p]));

  const commissionsInRange = commissions.filter((c) => {
    if (c.status === "CANCELED") return false;
    const d = new Date(c.createdAt);
    return d >= fromDate && d <= toDate;
  });

  const totalByProfessional = new Map<string, number>();
  for (const c of commissionsInRange) {
    totalByProfessional.set(
      c.professionalId,
      (totalByProfessional.get(c.professionalId) ?? 0) + Number(c.commissionAmount),
    );
  }

  const rows = Array.from(totalByProfessional.entries())
    .map(([professionalId, total]) => ({
      professionalId,
      name: professionalById.get(professionalId)?.name ?? "—",
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const totalCommission = commissionsInRange.reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wallet className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Comissões</h1>
          <p className="text-muted-foreground text-sm">
            {formatCurrency(totalCommission)} em comissão gerada no período (exclui canceladas).
          </p>
        </div>
      </div>

      <DateRangeForm action="/relatorios/comissoes" from={from} to={to} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Por profissional</h2>
        <ExportCsvButton
          rows={rows.map((r) => ({ profissional: r.name, comissão: r.total }))}
          filename="comissoes-por-profissional.csv"
          label="Exportar CSV"
        />
      </div>
      <RevenueBreakdownChart data={rows.map((r) => ({ name: r.name, total: r.total }))} />
      <DataTable
        rows={rows}
        rowKey={(r) => r.professionalId}
        emptyMessage="Nenhuma comissão gerada no período."
        columns={[
          { header: "Profissional", cell: (r) => r.name },
          { header: "Comissão", cell: (r) => formatCurrency(r.total) },
        ]}
      />
    </div>
  );
}
