import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
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
import { NewBlockButton } from "./new-block-button";
import { NewResourceButton } from "./new-resource-button";
import { AvailabilityPanel } from "./availability-panel";
import { AppointmentsPanel } from "./appointments-panel";

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

  const professionalById = new Map(professionals.map((p) => [p.id, p]));
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
          <TabsTrigger value="resources">Salas e Equipamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentsPanel
            appointments={sortedAppointments}
            clients={clients}
            professionals={professionals}
            services={services}
            resources={resources}
            appointmentsError={appointmentsError}
            canCreate={hasPermission(user, "appointments.create")}
            canManage={
              hasPermission(user, "appointments.cancel") || hasPermission(user, "appointments.no_show")
            }
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
