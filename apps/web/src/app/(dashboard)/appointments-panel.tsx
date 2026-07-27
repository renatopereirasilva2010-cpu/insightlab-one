"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  appointmentStatusLabels,
  appointmentStatusVariants,
} from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Appointment, Client, Professional, ServiceCatalogItem } from "@/lib/api-types";
import { NewAppointmentButton } from "./new-appointment-button";
import { AppointmentRowActions } from "./appointment-row-actions";
import { AgendaCalendar } from "./agenda-calendar";
import type { OperationalResource } from "@/lib/api-types";

const ALL = "__all__";

export function AppointmentsPanel({
  appointments,
  clients,
  professionals,
  services,
  resources,
  appointmentsError,
  canCreate,
  canManage,
}: {
  appointments: Appointment[];
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  resources: OperationalResource[];
  appointmentsError?: string;
  canCreate: boolean;
  canManage: boolean;
}) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [professionalFilter, setProfessionalFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const professionalById = useMemo(
    () => new Map(professionals.map((p) => [p.id, p])),
    [professionals],
  );
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const sorted = useMemo(
    () =>
      [...appointments].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [appointments],
  );

  const filtered = sorted.filter((a) => {
    if (professionalFilter !== ALL && a.professionalId !== professionalFilter) return false;
    if (statusFilter !== ALL && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border p-0.5">
          <Button
            variant={viewMode === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            Calendário
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            Lista
          </Button>
        </div>

        {viewMode === "list" && (
          <div className="flex flex-wrap gap-2">
            <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os profissionais</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os status</SelectItem>
                {Object.entries(appointmentStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {viewMode === "list" && canCreate && (
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

      {viewMode === "calendar" ? (
        <AgendaCalendar
          appointments={sorted}
          clients={clients}
          professionals={professionals}
          services={services}
          resources={resources}
          canManage={canManage}
          canCreate={canCreate}
        />
      ) : (
        <DataTable<Appointment>
          rows={filtered}
          rowKey={(a) => a.id}
          emptyMessage="Nenhum agendamento encontrado para os filtros selecionados."
          columns={[
            { header: "Cliente", cell: (a) => clientById.get(a.clientId)?.name ?? "—" },
            { header: "Serviço", cell: (a) => serviceById.get(a.serviceId)?.name ?? "—" },
            {
              header: "Profissional",
              cell: (a) =>
                a.professionalId ? professionalById.get(a.professionalId)?.name ?? "—" : "—",
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
              cell: (a) => (canManage ? <AppointmentRowActions appointment={a} /> : null),
            },
          ]}
        />
      )}
    </div>
  );
}
