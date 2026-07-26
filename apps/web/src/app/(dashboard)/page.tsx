import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  appointmentStatusLabels,
  appointmentStatusVariants,
} from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  Appointment,
  AppointmentBlock,
  Client,
  Professional,
  ServiceCatalogItem,
  OperationalResource,
} from "@/lib/api-types";
import { NewAppointmentButton } from "./new-appointment-button";
import { NewBlockButton } from "./new-block-button";
import { NewResourceButton } from "./new-resource-button";
import { AppointmentRowActions } from "./appointment-row-actions";
import { AvailabilityPanel } from "./availability-panel";

export default async function AgendaPage() {
  const user = await verifySession();

  const [
    { items: appointments, error: appointmentsError },
    { items: blocks, error: blocksError },
    { items: clients },
    { items: professionals },
    { items: services },
    { items: resources },
  ] = await Promise.all([
    safeList<Appointment>("/v1/appointments"),
    safeList<AppointmentBlock>("/v1/appointment-blocks"),
    safeList<Client>("/v1/clients"),
    safeList<Professional>("/v1/professionals"),
    safeList<ServiceCatalogItem>("/v1/services-catalog"),
    safeList<OperationalResource>("/v1/resources"),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const professionalById = new Map(professionals.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const resourceById = new Map(resources.map((r) => [r.id, r]));

  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="text-muted-foreground">
          Agendamentos, bloqueios de horário e disponibilidade da equipe.
        </p>
      </div>

      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="blocks">Bloqueios</TabsTrigger>
          <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex justify-end">
            {hasPermission(user, "appointments.create") && (
              <NewAppointmentButton
                clients={clients}
                professionals={professionals}
                services={services}
                resources={resources}
              />
            )}
          </div>

          {appointmentsError && (
            <p className="text-sm text-muted-foreground" role="alert">
              {appointmentsError}
            </p>
          )}

          <DataTable<Appointment>
            rows={sortedAppointments}
            rowKey={(a) => a.id}
            emptyMessage="Nenhum agendamento ainda."
            columns={[
              { header: "Cliente", cell: (a) => clientById.get(a.clientId)?.name ?? "—" },
              { header: "Serviço", cell: (a) => serviceById.get(a.serviceId)?.name ?? "—" },
              {
                header: "Profissional",
                cell: (a) => (a.professionalId ? professionalById.get(a.professionalId)?.name ?? "—" : "—"),
              },
              { header: "Início", cell: (a) => formatDateTime(a.startAt) },
              { header: "Término", cell: (a) => formatDateTime(a.endAt) },
              {
                header: "Status",
                cell: (a) => (
                  <StatusBadge
                    status={a.status}
                    labels={appointmentStatusLabels}
                    variants={appointmentStatusVariants}
                  />
                ),
              },
              {
                header: "",
                className: "text-right",
                cell: (a) =>
                  hasPermission(user, "appointments.cancel") ||
                  hasPermission(user, "appointments.no_show") ? (
                    <AppointmentRowActions appointment={a} />
                  ) : null,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <div className="flex justify-end">
            {hasPermission(user, "appointments.block") && (
              <NewBlockButton professionals={professionals} resources={resources} />
            )}
          </div>

          {blocksError && (
            <p className="text-sm text-muted-foreground" role="alert">
              {blocksError}
            </p>
          )}

          <DataTable<AppointmentBlock>
            rows={blocks}
            rowKey={(b) => b.id}
            emptyMessage="Nenhum bloqueio ativo."
            columns={[
              {
                header: "Profissional",
                cell: (b) => (b.professionalId ? professionalById.get(b.professionalId)?.name ?? "—" : "—"),
              },
              {
                header: "Recurso",
                cell: (b) => (b.resourceId ? resourceById.get(b.resourceId)?.name ?? "—" : "—"),
              },
              { header: "Início", cell: (b) => formatDateTime(b.startsAt) },
              { header: "Término", cell: (b) => formatDateTime(b.endsAt) },
              { header: "Motivo", cell: (b) => b.reason ?? "—" },
            ]}
          />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityPanel professionals={professionals} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex justify-end">
            {hasPermission(user, "resources.create") && <NewResourceButton />}
          </div>

          <DataTable<OperationalResource>
            rows={resources}
            rowKey={(r) => r.id}
            emptyMessage="Nenhum recurso cadastrado."
            columns={[
              { header: "Nome", cell: (r) => r.name },
              { header: "Tipo", cell: (r) => r.type },
              { header: "Descrição", cell: (r) => r.description ?? "—" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
