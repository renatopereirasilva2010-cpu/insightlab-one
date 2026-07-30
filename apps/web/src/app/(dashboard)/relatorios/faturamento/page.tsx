import { TrendingUp } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { formatCurrency } from "@/lib/format";
import type { Sale, Payment, Professional, ServiceCatalogItem } from "@/lib/api-types";
import { RevenueTrendChart, RevenueBreakdownChart } from "../../painel/revenue-charts";
import { ExportCsvButton } from "../../painel/export-button";
import { DateRangeForm, parseDateRange } from "../date-range-form";
import { NoReportAccess } from "../no-report-access";

export default async function FaturamentoReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await verifySession();
  if (!hasPermission(user, "reports.revenue.read")) return <NoReportAccess />;

  const { from, to, fromDate, toDate } = parseDateRange(await searchParams, 30);

  const [{ items: sales }, { items: payments }, { items: professionals }, { items: services }] =
    await Promise.all([
      safeList<Sale>("/v1/sales"),
      safeList<Payment>("/v1/payments"),
      safeList<Professional>("/v1/professionals"),
      safeList<ServiceCatalogItem>("/v1/services-catalog"),
    ]);

  const professionalById = new Map(professionals.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const salesInRange = sales.filter((s) => {
    if (s.status !== "COMPLETED") return false;
    const d = new Date(s.updatedAt);
    return d >= fromDate && d <= toDate;
  });

  const revenueByProfessional = new Map<string, number>();
  const revenueByService = new Map<string, number>();
  for (const sale of salesInRange) {
    if (sale.professionalId) {
      revenueByProfessional.set(
        sale.professionalId,
        (revenueByProfessional.get(sale.professionalId) ?? 0) + Number(sale.totalAmount),
      );
    }
    for (const item of sale.items) {
      if (item.itemType !== "SERVICE" || !item.serviceId) continue;
      revenueByService.set(
        item.serviceId,
        (revenueByService.get(item.serviceId) ?? 0) + Number(item.totalPrice),
      );
    }
  }

  const professionalRows = Array.from(revenueByProfessional.entries())
    .map(([professionalId, total]) => ({
      professionalId,
      name: professionalById.get(professionalId)?.name ?? "—",
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const serviceRows = Array.from(revenueByService.entries())
    .map(([serviceId, total]) => ({
      serviceId,
      name: serviceById.get(serviceId)?.name ?? "—",
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const revenueByDayMap = new Map<string, number>();
  const cursor = new Date(fromDate);
  // Limite de 92 dias no grafico de tendencia - alem disso o eixo fica
  // ilegivel; o total/tabelas abaixo continuam cobrindo o periodo inteiro.
  let guard = 0;
  while (cursor <= toDate && guard < 92) {
    revenueByDayMap.set(dayKey(cursor), 0);
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  for (const p of payments) {
    if (p.status !== "PAID" || !p.paidAt) continue;
    const paidDate = new Date(p.paidAt);
    if (paidDate < fromDate || paidDate > toDate) continue;
    const key = dayKey(paidDate);
    if (revenueByDayMap.has(key)) {
      revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + Number(p.amount));
    }
  }
  const trendRows = Array.from(revenueByDayMap.entries()).map(([date, total]) => ({
    date: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    faturamento: Math.round(total * 100) / 100,
  }));

  const totalRevenue = salesInRange.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Faturamento</h1>
          <p className="text-muted-foreground text-sm">
            {formatCurrency(totalRevenue)} em vendas concluídas no período selecionado.
          </p>
        </div>
      </div>

      <DateRangeForm action="/relatorios/faturamento" from={from} to={to} />

      <RevenueTrendChart data={trendRows} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Por profissional</h2>
            <ExportCsvButton
              rows={professionalRows.map((r) => ({ profissional: r.name, faturamento: r.total }))}
              filename="faturamento-por-profissional.csv"
              label="CSV"
            />
          </div>
          <RevenueBreakdownChart data={professionalRows.map((r) => ({ name: r.name, total: r.total }))} />
          <DataTable
            rows={professionalRows}
            rowKey={(r) => r.professionalId}
            emptyMessage="Nenhuma venda concluída no período."
            columns={[
              { header: "Profissional", cell: (r) => r.name },
              { header: "Faturamento", cell: (r) => formatCurrency(r.total) },
            ]}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Por serviço</h2>
            <ExportCsvButton
              rows={serviceRows.map((r) => ({ serviço: r.name, faturamento: r.total }))}
              filename="faturamento-por-servico.csv"
              label="CSV"
            />
          </div>
          <RevenueBreakdownChart data={serviceRows.map((r) => ({ name: r.name, total: r.total }))} />
          <DataTable
            rows={serviceRows}
            rowKey={(r) => r.serviceId}
            emptyMessage="Nenhum serviço vendido no período."
            columns={[
              { header: "Serviço", cell: (r) => r.name },
              { header: "Faturamento", cell: (r) => formatCurrency(r.total) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
