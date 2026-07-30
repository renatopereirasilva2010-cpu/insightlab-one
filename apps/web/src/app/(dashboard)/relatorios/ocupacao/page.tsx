import { CalendarClock } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import type { Appointment, Professional } from "@/lib/api-types";
import { ExportCsvButton } from "../../painel/export-button";
import { DateRangeForm, parseDateRange } from "../date-range-form";
import { NoReportAccess } from "../no-report-access";

export default async function OcupacaoReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await verifySession();
  if (!hasPermission(user, "reports.appointments.read")) return <NoReportAccess />;

  const { from, to, fromDate, toDate } = parseDateRange(await searchParams, 30);

  const [{ items: appointments }, { items: professionals }] = await Promise.all([
    safeList<Appointment>("/v1/appointments"),
    safeList<Professional>("/v1/professionals"),
  ]);

  const professionalById = new Map(professionals.map((p) => [p.id, p]));

  const appointmentsInRange = appointments.filter((a) => {
    const d = new Date(a.startAt);
    return d >= fromDate && d <= toDate;
  });

  type Row = { professionalId: string; name: string; total: number; completed: number; canceled: number; noShow: number };
  const byProfessional = new Map<string, Row>();
  for (const a of appointmentsInRange) {
    const key = a.professionalId ?? "sem-profissional";
    const row =
      byProfessional.get(key) ??
      ({
        professionalId: key,
        name: a.professionalId ? professionalById.get(a.professionalId)?.name ?? "—" : "Sem profissional",
        total: 0,
        completed: 0,
        canceled: 0,
        noShow: 0,
      } satisfies Row);
    row.total += 1;
    if (a.status === "COMPLETED") row.completed += 1;
    if (a.status === "CANCELED") row.canceled += 1;
    if (a.status === "NO_SHOW") row.noShow += 1;
    byProfessional.set(key, row);
  }

  const rows = Array.from(byProfessional.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Ocupação de agenda</h1>
          <p className="text-muted-foreground text-sm">
            {appointmentsInRange.length} agendamento(s) no período selecionado.
          </p>
        </div>
      </div>

      <DateRangeForm action="/relatorios/ocupacao" from={from} to={to} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Por profissional</h2>
        <ExportCsvButton
          rows={rows.map((r) => ({
            profissional: r.name,
            total: r.total,
            concluídos: r.completed,
            cancelados: r.canceled,
            faltas: r.noShow,
          }))}
          filename="ocupacao-por-profissional.csv"
          label="Exportar CSV"
        />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.professionalId}
        emptyMessage="Nenhum agendamento no período."
        columns={[
          { header: "Profissional", cell: (r) => r.name },
          { header: "Total", cell: (r) => r.total },
          { header: "Concluídos", cell: (r) => r.completed },
          { header: "Cancelados", cell: (r) => r.canceled },
          { header: "Faltas", cell: (r) => r.noShow },
        ]}
      />
    </div>
  );
}
