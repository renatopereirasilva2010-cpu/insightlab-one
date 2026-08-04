import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StatusBadge,
  genericStatusLabels,
  genericStatusVariants,
  appointmentStatusLabels,
  appointmentStatusVariants,
  attendanceStatusLabels,
  attendanceStatusVariants,
  saleStatusLabels,
  saleStatusVariants,
} from "@/components/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type {
  Client,
  Appointment,
  Attendance,
  Sale,
  ServiceCatalogItem,
  Professional,
} from "@/lib/api-types";
import { DeleteClientButton } from "../delete-client-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await verifySession();

  const [
    { items: clients },
    { items: appointments },
    { items: attendances },
    { items: sales },
    { items: services },
    { items: professionals },
  ] = await Promise.all([
    safeList<Client>("/v1/clients"),
    safeList<Appointment>("/v1/appointments"),
    safeList<Attendance>("/v1/attendances"),
    safeList<Sale>("/v1/sales"),
    safeList<ServiceCatalogItem>("/v1/services-catalog"),
    safeList<Professional>("/v1/professionals"),
  ]);

  const client = clients.find((c) => c.id === id);
  if (!client) notFound();

  const serviceById = new Map(services.map((s) => [s.id, s]));
  const professionalById = new Map(professionals.map((p) => [p.id, p]));

  const clientAppointments = appointments
    .filter((a) => a.clientId === id)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  const clientAttendances = attendances
    .filter((a) => a.clientId === id)
    .sort(
      (a, b) =>
        new Date(b.startedAt ?? b.createdAt).getTime() -
        new Date(a.startedAt ?? a.createdAt).getTime(),
    );

  const clientSales = sales
    .filter((s) => s.clientId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const completedSales = clientSales.filter((s) => s.status === "COMPLETED");
  const totalSpent = completedSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const lastVisit = clientAttendances.find((a) => a.finishedAt)?.finishedAt ?? null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/clientes">
          <ArrowLeft />
          Voltar para Clientes
        </Link>
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-muted-foreground">
            {client.phone ?? "Sem telefone"} · {client.email ?? "Sem e-mail"} · Cliente desde{" "}
            {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={client.status} labels={genericStatusLabels} variants={genericStatusVariants} />
          {hasPermission(user, "clients.delete") && <DeleteClientButton client={client} />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Vendas concluídas</CardDescription>
            <CardTitle className="text-2xl">{completedSales.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total gasto</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalSpent)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Última visita</CardDescription>
            <CardTitle className="text-2xl">
              {lastVisit ? formatDate(lastVisit) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Agendamentos</h2>
        <DataTable<Appointment>
          rows={clientAppointments}
          rowKey={(a) => a.id}
          emptyMessage="Nenhum agendamento para este cliente ainda."
          columns={[
            { header: "Serviço", cell: (a) => serviceById.get(a.serviceId)?.name ?? "—" },
            {
              header: "Profissional",
              cell: (a) => (a.professionalId ? professionalById.get(a.professionalId)?.name ?? "—" : "—"),
            },
            { header: "Início", cell: (a) => formatDateTime(a.startAt) },
            {
              header: "Status",
              cell: (a) => (
                <StatusBadge status={a.status} labels={appointmentStatusLabels} variants={appointmentStatusVariants} />
              ),
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Atendimentos</h2>
        <DataTable<Attendance>
          rows={clientAttendances}
          rowKey={(a) => a.id}
          emptyMessage="Nenhum atendimento para este cliente ainda."
          columns={[
            { header: "Serviço", cell: (a) => serviceById.get(a.serviceId)?.name ?? "—" },
            {
              header: "Profissional",
              cell: (a) => (a.professionalId ? professionalById.get(a.professionalId)?.name ?? "—" : "—"),
            },
            { header: "Início", cell: (a) => formatDateTime(a.startedAt) },
            { header: "Fim", cell: (a) => formatDateTime(a.finishedAt) },
            {
              header: "Status",
              cell: (a) => (
                <StatusBadge status={a.status} labels={attendanceStatusLabels} variants={attendanceStatusVariants} />
              ),
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Vendas</h2>
        <DataTable<Sale>
          rows={clientSales}
          rowKey={(s) => s.id}
          emptyMessage="Nenhuma venda para este cliente ainda."
          columns={[
            { header: "Itens", cell: (s) => s.items.length },
            { header: "Total", cell: (s) => formatCurrency(s.totalAmount) },
            {
              header: "Status",
              cell: (s) => (
                <StatusBadge status={s.status} labels={saleStatusLabels} variants={saleStatusVariants} />
              ),
            },
            { header: "Criada em", cell: (s) => formatDateTime(s.createdAt) },
            {
              header: "",
              className: "text-right",
              cell: (s) => (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/vendas/${s.id}`}>Abrir</Link>
                </Button>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
