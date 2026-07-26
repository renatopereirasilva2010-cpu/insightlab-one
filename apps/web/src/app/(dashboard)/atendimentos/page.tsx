import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  attendanceStatusLabels,
  attendanceStatusVariants,
} from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { Attendance, Client, Professional, ServiceCatalogItem, Appointment } from "@/lib/api-types";
import { NewAttendanceButton } from "./new-attendance-button";
import { AttendanceRowActions } from "./attendance-row-actions";

export default async function AtendimentosPage() {
  const user = await verifySession();

  const [
    { items: attendances, error },
    { items: clients },
    { items: professionals },
    { items: services },
    { items: appointments },
  ] = await Promise.all([
    safeList<Attendance>("/v1/attendances"),
    safeList<Client>("/v1/clients"),
    safeList<Professional>("/v1/professionals"),
    safeList<ServiceCatalogItem>("/v1/services-catalog"),
    safeList<Appointment>("/v1/appointments"),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const professionalById = new Map(professionals.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const linkableAppointments = appointments.filter((a) =>
    ["SCHEDULED", "CONFIRMED", "CHECKED_IN"].includes(a.status),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Atendimentos</h1>
          <p className="text-muted-foreground">
            Acompanhe o atendimento do cliente do início ao fim.
          </p>
        </div>
        {hasPermission(user, "attendances.create") && (
          <NewAttendanceButton
            clients={clients}
            professionals={professionals}
            services={services}
            appointments={linkableAppointments}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<Attendance>
        rows={attendances}
        rowKey={(a) => a.id}
        emptyMessage="Nenhum atendimento ainda."
        columns={[
          { header: "Cliente", cell: (a) => clientById.get(a.clientId)?.name ?? "—" },
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
              <StatusBadge
                status={a.status}
                labels={attendanceStatusLabels}
                variants={attendanceStatusVariants}
              />
            ),
          },
          {
            header: "",
            className: "text-right",
            cell: (a) =>
              hasPermission(user, "attendances.start") || hasPermission(user, "attendances.finish") ? (
                <AttendanceRowActions attendance={a} />
              ) : null,
          },
        ]}
      />
    </div>
  );
}
