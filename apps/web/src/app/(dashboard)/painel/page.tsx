import { verifySession } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/lib/api-types";
import { DormantClientsPanel } from "./dormant-clients-panel";

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
  await verifySession();

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
  ]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="text-muted-foreground">Resumo do dia e clientes que precisam de atenção.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Faturamento hoje</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(revenueToday)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Comissão gerada hoje</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(commissionTotalToday)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Caixas abertos agora</CardDescription>
            <CardTitle className="text-2xl">{openRegisters.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Saldo de abertura (caixas abertos)</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(openBalance)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Faturamento por profissional (hoje)</h2>
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
          <h2 className="text-lg font-medium">Faturamento por serviço (hoje)</h2>
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
