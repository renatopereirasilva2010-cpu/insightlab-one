import { Sparkles, Wallet, Percent, Banknote, PiggyBank } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/format";
import type {
  Client,
  Appointment,
  Attendance,
  Sale,
  Payment,
  Commission,
  CashRegister,
  Professional,
  ServiceCatalogItem,
  UserListItem,
  BusinessSettings,
} from "@/lib/api-types";
import { DormantClientsPanel } from "./dormant-clients-panel";
import { QuickStartGuide, type QuickStartStep } from "./quick-start-guide";
import { RevenueTrendChart, RevenueBreakdownChart } from "./revenue-charts";
import { ExportCsvButton } from "./export-button";
import { AutoRefreshOnFocus } from "./auto-refresh";

async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  try {
    return await apiFetch<BusinessSettings>("/v1/business-settings");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return null;
    throw err;
  }
}

function isToday(value: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default async function PainelPage() {
  const user = await verifySession();
  const isAdmin = hasPermission(user, "roles.read");

  const [
    { items: clients },
    { items: appointments },
    { items: attendances },
    { items: sales },
    { items: payments },
    { items: commissions },
    { items: cashRegisters },
    { items: professionals },
    { items: services },
    { items: users },
    businessSettings,
  ] = await Promise.all([
    safeList<Client>("/v1/clients"),
    safeList<Appointment>("/v1/appointments"),
    safeList<Attendance>("/v1/attendances"),
    safeList<Sale>("/v1/sales"),
    safeList<Payment>("/v1/payments"),
    safeList<Commission>("/v1/commissions"),
    safeList<CashRegister>("/v1/cash-register"),
    safeList<Professional>("/v1/professionals"),
    safeList<ServiceCatalogItem>("/v1/services-catalog"),
    isAdmin ? safeList<UserListItem>("/v1/users") : Promise.resolve({ items: [] as UserListItem[] }),
    isAdmin ? fetchBusinessSettings() : Promise.resolve(null),
  ]);

  const quickStartSteps: QuickStartStep[] = [
    {
      key: "business-settings",
      label: "Configurar dados do negócio",
      description: "Fuso horário, moeda, política de cancelamento e liberação de comissão.",
      href: "/configuracoes",
      done: Boolean(businessSettings),
    },
    {
      key: "professionals",
      label: "Cadastrar profissionais",
      description: "Equipe que vai atender e receber comissão.",
      href: "/profissionais",
      done: professionals.length > 0,
    },
    {
      key: "services",
      label: "Cadastrar serviços",
      description: "Catálogo de serviços com duração e preço.",
      href: "/servicos",
      done: services.length > 0,
    },
    {
      key: "clients",
      label: "Cadastrar clientes",
      description: "Pode crescer aos poucos com o uso — não precisa importar tudo de uma vez.",
      href: "/clientes",
      done: clients.length > 0,
    },
    {
      key: "team-access",
      label: "Dar acesso à equipe",
      description: "Crie logins para recepção e profissionais além do seu.",
      href: "/configuracoes",
      done: users.length > 1,
    },
  ];

  const professionalById = new Map(professionals.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const paymentsToday = payments.filter((p) => p.status === "PAID" && isToday(p.paidAt));
  const revenueToday = paymentsToday.reduce((sum, p) => sum + Number(p.amount), 0);

  const commissionsToday = commissions.filter((c) => isToday(c.createdAt));
  const commissionTotalToday = commissionsToday.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0,
  );

  const openRegisters = cashRegisters.filter((r) => r.status === "OPEN");
  const openBalance = openRegisters.reduce((sum, r) => sum + Number(r.openingBalance), 0);

  const salesCompletedToday = sales.filter((s) => s.status === "COMPLETED" && isToday(s.updatedAt));

  const revenueByProfessional = new Map<string, number>();
  for (const sale of salesCompletedToday) {
    if (!sale.professionalId) continue;
    revenueByProfessional.set(
      sale.professionalId,
      (revenueByProfessional.get(sale.professionalId) ?? 0) + Number(sale.totalAmount),
    );
  }

  const revenueByService = new Map<string, number>();
  for (const sale of salesCompletedToday) {
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

  // Tendencia de faturamento dos ultimos 14 dias, a partir dos mesmos
  // pagamentos ja carregados - sem endpoint novo.
  const TREND_DAYS = 14;
  // Chave em hora local, nao UTC (mesmo criterio de "hoje" usado em
  // isToday() acima) - evitar que o fuso (UTC-3) empurre pagamentos da
  // noite pro dia seguinte no grafico.
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date();
  const revenueByDayMap = new Map<string, number>();
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    revenueByDayMap.set(dayKey(d), 0);
  }
  for (const p of payments) {
    if (p.status !== "PAID" || !p.paidAt) continue;
    const key = dayKey(new Date(p.paidAt));
    if (revenueByDayMap.has(key)) {
      revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + Number(p.amount));
    }
  }
  const trendRows = Array.from(revenueByDayMap.entries()).map(([date, total]) => ({
    date: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
    faturamento: Math.round(total * 100) / 100,
  }));

  const exportSummaryRows = [
    { indicador: "Faturamento hoje", valor: revenueToday },
    { indicador: "Comissão gerada hoje", valor: commissionTotalToday },
    { indicador: "Caixas abertos agora", valor: openRegisters.length },
    { indicador: "Saldo de abertura (caixas abertos)", valor: openBalance },
  ];

  return (
    <div className="space-y-6">
      <AutoRefreshOnFocus />
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Inteligência de Receita</h1>
          <p className="text-muted-foreground text-sm">
            Revenue Recovery Intelligence — resumo do dia, tendência e clientes que precisam de atenção.
          </p>
        </div>
      </div>

      {isAdmin && <QuickStartGuide steps={quickStartSteps} />}

      <div className="flex items-center justify-between">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Faturamento hoje" value={formatCurrency(revenueToday)} icon={Wallet} tone="gold" />
          <StatCard
            label="Comissão gerada hoje"
            value={formatCurrency(commissionTotalToday)}
            icon={Percent}
            tone="indigo"
          />
          <StatCard
            label="Caixas abertos agora"
            value={String(openRegisters.length)}
            icon={Banknote}
            tone="gold"
          />
          <StatCard
            label="Saldo de abertura (caixas abertos)"
            value={formatCurrency(openBalance)}
            icon={PiggyBank}
            tone="indigo"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Faturamento — últimos 14 dias</h2>
        <ExportCsvButton rows={exportSummaryRows} filename="resumo-painel.csv" label="Exportar resumo (CSV)" />
      </div>
      <RevenueTrendChart data={trendRows} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Faturamento por profissional (hoje)</h2>
            <ExportCsvButton
              rows={professionalRows.map((r) => ({ profissional: r.name, faturamento: r.total }))}
              filename="faturamento-por-profissional.csv"
              label="CSV"
            />
          </div>
          <RevenueBreakdownChart data={professionalRows.map((r) => ({ name: r.name, total: r.total }))} />
          <DataTable<{ professionalId: string; name: string; total: number }>
            rows={professionalRows}
            rowKey={(r) => r.professionalId}
            emptyMessage="Nenhuma venda concluída hoje ainda."
            columns={[
              { header: "Profissional", cell: (r) => r.name },
              { header: "Faturamento", cell: (r) => formatCurrency(r.total) },
            ]}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Faturamento por serviço (hoje)</h2>
            <ExportCsvButton
              rows={serviceRows.map((r) => ({ serviço: r.name, faturamento: r.total }))}
              filename="faturamento-por-servico.csv"
              label="CSV"
            />
          </div>
          <RevenueBreakdownChart data={serviceRows.map((r) => ({ name: r.name, total: r.total }))} />
          <DataTable<{ serviceId: string; name: string; total: number }>
            rows={serviceRows}
            rowKey={(r) => r.serviceId}
            emptyMessage="Nenhum serviço vendido hoje ainda."
            columns={[
              { header: "Serviço", cell: (r) => r.name },
              { header: "Faturamento", cell: (r) => formatCurrency(r.total) },
            ]}
          />
        </section>
      </div>

      <DormantClientsPanel clients={clients} appointments={appointments} attendances={attendances} />
    </div>
  );
}
