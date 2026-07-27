"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  appointmentStatusLabels,
  appointmentStatusVariants,
} from "@/components/status-badge";
import { AppointmentRowActions } from "./appointment-row-actions";
import { NewAppointmentButton } from "./new-appointment-button";
import type {
  Appointment,
  Client,
  OperationalResource,
  Professional,
  ServiceCatalogItem,
} from "@/lib/api-types";

const PX_PER_MINUTE = 1.6;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;
const MIN_BLOCK_MINUTES = 20;
const MIN_HEIGHT_FOR_ACTIONS = 56;

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_ACCENT: Record<string, string> = {
  SCHEDULED: "border-l-muted-foreground/50",
  CONFIRMED: "border-l-blue-500",
  CHECKED_IN: "border-l-amber-500",
  IN_SERVICE: "border-l-violet-500",
  COMPLETED: "border-l-emerald-500",
  CANCELED: "border-l-destructive",
  NO_SHOW: "border-l-destructive",
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  return addDays(d, -day);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatWeekdayLong(date: Date): string {
  return date.toLocaleDateString("pt-BR", { weekday: "long" });
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatTimeRange(startAt: string, endAt: string): string {
  const start = new Date(startAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(endAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start} - ${end}`;
}

/** Assigns each appointment a lane so overlapping appointments (overbooking) render side by side instead of stacking. */
function assignLanes(items: Appointment[]): Map<string, { lane: number; laneCount: number }> {
  const sorted = [...items].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  const laneEndTimes: number[] = [];
  const laneByAppointment = new Map<string, number>();

  for (const appointment of sorted) {
    const start = new Date(appointment.startAt).getTime();
    const end = new Date(appointment.endAt).getTime();
    let lane = laneEndTimes.findIndex((endTime) => endTime <= start);
    if (lane === -1) {
      lane = laneEndTimes.length;
      laneEndTimes.push(end);
    } else {
      laneEndTimes[lane] = end;
    }
    laneByAppointment.set(appointment.id, lane);
  }

  // Overlapping groups can have a different lane count than the global max;
  // for simplicity (and because overbooking is meant to be visible, not perfectly packed)
  // we use the global lane count for every item in this set.
  const laneCount = Math.max(1, laneEndTimes.length);
  const result = new Map<string, { lane: number; laneCount: number }>();
  for (const appointment of sorted) {
    result.set(appointment.id, { lane: laneByAppointment.get(appointment.id) ?? 0, laneCount });
  }
  return result;
}

function AppointmentBlock({
  appointment,
  clientName,
  serviceName,
  canManage,
  heightPx,
  style,
}: {
  appointment: Appointment;
  clientName: string;
  serviceName: string;
  canManage: boolean;
  heightPx: number;
  style: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-card absolute overflow-hidden rounded-md border border-l-4 p-1.5 text-xs shadow-sm ${
        STATUS_ACCENT[appointment.status] ?? "border-l-muted-foreground/50"
      }`}
      style={style}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{clientName}</p>
        <p className="text-muted-foreground truncate">{serviceName}</p>
        <p className="text-muted-foreground">{formatTimeRange(appointment.startAt, appointment.endAt)}</p>
      </div>
      {canManage && heightPx >= MIN_HEIGHT_FOR_ACTIONS && (
        <div className="[&_button]:size-5 [&_button]:p-0 [&_svg]:size-3 mt-1 flex justify-end gap-0.5">
          <AppointmentRowActions appointment={appointment} />
        </div>
      )}
    </div>
  );
}

function EmptyDayState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-10 text-center">
      <p className="text-muted-foreground text-sm">Nenhum agendamento neste dia.</p>
      {canCreate && (
        <p className="text-muted-foreground text-xs">
          Use o botão &ldquo;Novo agendamento&rdquo; acima para criar o primeiro.
        </p>
      )}
    </div>
  );
}

type NewAppointmentButtonProps = {
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  resources: OperationalResource[];
};

function DayGrid({
  date,
  appointments,
  professionals,
  clientById,
  serviceById,
  canManage,
  canCreate,
}: {
  date: Date;
  appointments: Appointment[];
  professionals: Professional[];
  clientById: Map<string, Client>;
  serviceById: Map<string, ServiceCatalogItem>;
  canManage: boolean;
  canCreate: boolean;
}) {
  const dayAppointments = useMemo(
    () => appointments.filter((a) => isSameDay(new Date(a.startAt), date)),
    [appointments, date],
  );

  const { startHour, endHour } = useMemo(() => {
    let minHour = DEFAULT_START_HOUR;
    let maxHour = DEFAULT_END_HOUR;
    for (const a of dayAppointments) {
      const start = new Date(a.startAt);
      const end = new Date(a.endAt);
      minHour = Math.min(minHour, start.getHours());
      maxHour = Math.max(maxHour, end.getHours() + (end.getMinutes() > 0 ? 1 : 0));
    }
    return { startHour: minHour, endHour: maxHour };
  }, [dayAppointments]);

  const columns = useMemo(() => {
    const withAppointment = new Set(
      dayAppointments.map((a) => a.professionalId).filter((id): id is string => Boolean(id)),
    );
    const active = professionals.filter(
      (p) => p.status === "ACTIVE" || withAppointment.has(p.id),
    );
    const hasUnassigned = dayAppointments.some((a) => !a.professionalId);
    return hasUnassigned ? [...active, null] : active;
  }, [professionals, dayAppointments]);

  if (dayAppointments.length === 0) {
    return <EmptyDayState canCreate={canCreate} />;
  }

  const gridStartMinutes = startHour * 60;
  const totalMinutes = (endHour - startHour) * 60;
  const gridHeight = totalMinutes * PX_PER_MINUTE;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  const now = new Date();
  const showNowLine = isSameDay(now, date);
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) - gridStartMinutes) * PX_PER_MINUTE;

  return (
    <div className="overflow-x-auto rounded-md border">
      <div className="flex min-w-max">
        <div className="w-16 shrink-0 border-r">
          <div className="text-muted-foreground h-10 border-b px-2 py-2 text-xs">Hora</div>
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                className="text-muted-foreground absolute right-2 -translate-y-1/2 text-xs"
                style={{ top: (h * 60 - gridStartMinutes) * PX_PER_MINUTE }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>
        </div>

        {columns.map((professional) => {
          const columnAppointments = dayAppointments.filter(
            (a) => a.professionalId === (professional?.id ?? null),
          );
          const lanes = assignLanes(columnAppointments);

          return (
            <div key={professional?.id ?? "sem-profissional"} className="w-52 shrink-0 border-r last:border-r-0">
              <div className="h-10 truncate border-b px-2 py-2 text-sm font-medium">
                {professional?.name ?? "Sem profissional"}
              </div>
              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-border/60 absolute right-0 left-0 border-t"
                    style={{ top: (h * 60 - gridStartMinutes) * PX_PER_MINUTE }}
                  />
                ))}
                {showNowLine && nowTop >= 0 && nowTop <= gridHeight && (
                  <div
                    className="bg-destructive absolute right-0 left-0 z-10 h-px"
                    style={{ top: nowTop }}
                  />
                )}
                {columnAppointments.map((a) => {
                  const start = new Date(a.startAt);
                  const end = new Date(a.endAt);
                  const startMinutes = start.getHours() * 60 + start.getMinutes();
                  const durationMinutes = Math.max(
                    MIN_BLOCK_MINUTES,
                    (end.getTime() - start.getTime()) / 60000,
                  );
                  const { lane, laneCount } = lanes.get(a.id) ?? { lane: 0, laneCount: 1 };
                  const widthPct = 100 / laneCount;
                  const heightPx = durationMinutes * PX_PER_MINUTE;

                  return (
                    <AppointmentBlock
                      key={a.id}
                      appointment={a}
                      clientName={clientById.get(a.clientId)?.name ?? "—"}
                      serviceName={serviceById.get(a.serviceId)?.name ?? "—"}
                      canManage={canManage}
                      heightPx={heightPx}
                      style={{
                        top: (startMinutes - gridStartMinutes) * PX_PER_MINUTE,
                        height: heightPx,
                        left: `${lane * widthPct}%`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekAgenda({
  weekStart,
  appointments,
  professionalById,
  clientById,
  serviceById,
}: {
  weekStart: Date;
  appointments: Appointment[];
  professionalById: Map<string, Professional>;
  clientById: Map<string, Client>;
  serviceById: Map<string, ServiceCatalogItem>;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const dayAppointments = appointments
          .filter((a) => isSameDay(new Date(a.startAt), day))
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        const isToday = isSameDay(day, new Date());

        return (
          <div key={day.toISOString()} className={`rounded-md border p-2 ${isToday ? "border-primary" : ""}`}>
            <div className="mb-2 text-sm font-medium">
              {WEEKDAY_LABELS[day.getDay()]} <span className="text-muted-foreground">{formatDayLabel(day)}</span>
            </div>
            {dayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-xs">Nenhum agendamento.</p>
            ) : (
              <div className="space-y-1.5">
                {dayAppointments.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded border border-l-4 p-1.5 text-xs ${
                      STATUS_ACCENT[a.status] ?? "border-l-muted-foreground/50"
                    }`}
                  >
                    <p className="truncate font-medium">{clientById.get(a.clientId)?.name ?? "—"}</p>
                    <p className="text-muted-foreground truncate">
                      {serviceById.get(a.serviceId)?.name ?? "—"}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(a.startAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {a.professionalId ? ` · ${professionalById.get(a.professionalId)?.name ?? "—"}` : ""}
                    </p>
                    <div className="mt-1">
                      <StatusBadge
                        status={a.status}
                        labels={appointmentStatusLabels}
                        variants={appointmentStatusVariants}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AgendaCalendar({
  appointments,
  clients,
  professionals,
  services,
  resources,
  canManage,
  canCreate,
}: {
  appointments: Appointment[];
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  resources: OperationalResource[];
  canManage: boolean;
  canCreate: boolean;
}) {
  const [mode, setMode] = useState<"day" | "week">("day");
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const professionalById = useMemo(
    () => new Map(professionals.map((p) => [p.id, p])),
    [professionals],
  );

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);

  const newAppointmentProps: NewAppointmentButtonProps = { clients, professionals, services, resources };

  function goToPrevious() {
    setAnchorDate((d) => addDays(d, mode === "day" ? -1 : -7));
  }

  function goToNext() {
    setAnchorDate((d) => addDays(d, mode === "day" ? 1 : 7));
  }

  function goToToday() {
    setAnchorDate(startOfDay(new Date()));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious} aria-label="Anterior">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext} aria-label="Próximo">
            <ChevronRight />
          </Button>
          <span className="text-sm font-medium capitalize">
            {mode === "day"
              ? `${formatWeekdayLong(anchorDate)}, ${formatDayLabel(anchorDate)}`
              : `Semana de ${formatDayLabel(weekStart)} a ${formatDayLabel(addDays(weekStart, 6))}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            <Button
              variant={mode === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("day")}
            >
              Dia
            </Button>
            <Button
              variant={mode === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("week")}
            >
              Semana
            </Button>
          </div>
          {canCreate && (
            <NewAppointmentButton {...newAppointmentProps} />
          )}
        </div>
      </div>

      {mode === "day" ? (
        <DayGrid
          date={anchorDate}
          appointments={appointments}
          professionals={professionals}
          clientById={clientById}
          serviceById={serviceById}
          canManage={canManage}
          canCreate={canCreate}
        />
      ) : (
        <WeekAgenda
          weekStart={weekStart}
          appointments={appointments}
          professionalById={professionalById}
          clientById={clientById}
          serviceById={serviceById}
        />
      )}
    </div>
  );
}
