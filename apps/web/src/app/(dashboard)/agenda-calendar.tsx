"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  StatusBadge,
  appointmentStatusLabels,
  appointmentStatusVariants,
} from "@/components/status-badge";
import { AppointmentRowActions } from "./appointment-row-actions";
import { AppointmentForm } from "./appointment-form";
import type {
  Appointment,
  AppointmentBlock,
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
const SLOT_SNAP_MINUTES = 15;
const DEFAULT_CLICK_DURATION_MINUTES = 30;

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

  const laneCount = Math.max(1, laneEndTimes.length);
  const result = new Map<string, { lane: number; laneCount: number }>();
  for (const appointment of sorted) {
    result.set(appointment.id, { lane: laneByAppointment.get(appointment.id) ?? 0, laneCount });
  }
  return result;
}

function AppointmentCard({
  appointment,
  clientName,
  serviceName,
  canManage,
  heightPx,
  style,
  onEdit,
}: {
  appointment: Appointment;
  clientName: string;
  serviceName: string;
  canManage: boolean;
  heightPx: number;
  style: React.CSSProperties;
  onEdit: (() => void) | null;
}) {
  return (
    <div
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onEdit?.();
      }}
      onKeyDown={(event) => {
        if (onEdit && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onEdit();
        }
      }}
      className={`bg-card absolute overflow-hidden rounded-md border border-l-4 p-1.5 text-xs shadow-sm ${
        onEdit ? "cursor-pointer hover:shadow-md" : ""
      } ${STATUS_ACCENT[appointment.status] ?? "border-l-muted-foreground/50"}`}
      style={style}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{clientName}</p>
        <p className="text-muted-foreground truncate">{serviceName}</p>
        <p className="text-muted-foreground">{formatTimeRange(appointment.startAt, appointment.endAt)}</p>
      </div>
      {canManage && heightPx >= MIN_HEIGHT_FOR_ACTIONS && (
        <div
          className="[&_button]:size-5 [&_button]:p-0 [&_svg]:size-3 mt-1 flex justify-end gap-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          <AppointmentRowActions appointment={appointment} />
        </div>
      )}
    </div>
  );
}

function BlockCard({ block, style }: { block: AppointmentBlock; style: React.CSSProperties }) {
  return (
    <div
      className="bg-muted/60 text-muted-foreground absolute overflow-hidden rounded-md border border-dashed p-1.5 text-xs"
      style={{
        ...style,
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent, transparent 6px, color-mix(in oklab, currentColor 8%, transparent) 6px, color-mix(in oklab, currentColor 8%, transparent) 12px)",
      }}
      title={block.reason ?? "Bloqueado"}
    >
      <p className="truncate font-medium">{block.reason ?? "Bloqueado"}</p>
      <p>{formatTimeRange(block.startsAt, block.endsAt)}</p>
    </div>
  );
}

type NewAppointmentButtonProps = {
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  resources: OperationalResource[];
};

/** Arredonda minutos-desde-meia-noite pro passo de snap mais próximo. */
function snapMinutes(minutes: number): number {
  return Math.round(minutes / SLOT_SNAP_MINUTES) * SLOT_SNAP_MINUTES;
}

function DayGrid({
  date,
  appointments,
  blocks,
  professionals,
  clientById,
  serviceById,
  canManage,
  canCreate,
  onSlotClick,
  onAppointmentClick,
}: {
  date: Date;
  appointments: Appointment[];
  blocks: AppointmentBlock[];
  professionals: Professional[];
  clientById: Map<string, Client>;
  serviceById: Map<string, ServiceCatalogItem>;
  canManage: boolean;
  canCreate: boolean;
  onSlotClick: (professionalId: string | null, startAt: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}) {
  const dayAppointments = useMemo(
    () => appointments.filter((a) => isSameDay(new Date(a.startAt), date)),
    [appointments, date],
  );

  const dayBlocks = useMemo(
    () => blocks.filter((b) => isSameDay(new Date(b.startsAt), date)),
    [blocks, date],
  );

  const { startHour, endHour } = useMemo(() => {
    let minHour = DEFAULT_START_HOUR;
    let maxHour = DEFAULT_END_HOUR;
    for (const start of [
      ...dayAppointments.map((a) => new Date(a.startAt)),
      ...dayBlocks.map((b) => new Date(b.startsAt)),
    ]) {
      minHour = Math.min(minHour, start.getHours());
    }
    for (const end of [
      ...dayAppointments.map((a) => new Date(a.endAt)),
      ...dayBlocks.map((b) => new Date(b.endsAt)),
    ]) {
      maxHour = Math.max(maxHour, end.getHours() + (end.getMinutes() > 0 ? 1 : 0));
    }
    return { startHour: minHour, endHour: maxHour };
  }, [dayAppointments, dayBlocks]);

  const columns = useMemo(() => {
    const withActivity = new Set(
      [...dayAppointments.map((a) => a.professionalId), ...dayBlocks.map((b) => b.professionalId)].filter(
        (id): id is string => Boolean(id),
      ),
    );
    const active = professionals.filter((p) => p.status === "ACTIVE" || withActivity.has(p.id));
    const hasUnassigned = dayAppointments.some((a) => !a.professionalId);
    return hasUnassigned ? [...active, null] : active;
  }, [professionals, dayAppointments, dayBlocks]);

  const gridStartMinutes = startHour * 60;
  const totalMinutes = (endHour - startHour) * 60;
  const gridHeight = totalMinutes * PX_PER_MINUTE;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // "now" só é conhecido no client (o servidor e o client hidratam em
  // instantes diferentes) - calcular no render causa hydration mismatch.
  // null até o primeiro effect rodar significa "não mostrar a linha ainda".
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);
  const showNowLine = now !== null && isSameDay(now, date);
  const nowTop = now
    ? ((now.getHours() * 60 + now.getMinutes()) - gridStartMinutes) * PX_PER_MINUTE
    : 0;

  function handleColumnClick(professionalId: string | null, event: React.MouseEvent<HTMLDivElement>) {
    if (!canCreate) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const rawMinutes = gridStartMinutes + offsetY / PX_PER_MINUTE;
    const snapped = Math.max(gridStartMinutes, snapMinutes(rawMinutes));
    const startAt = new Date(date);
    startAt.setHours(0, snapped, 0, 0);
    onSlotClick(professionalId, startAt);
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      {columns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 p-10 text-center">
          <p className="text-muted-foreground text-sm">Nenhum profissional ativo cadastrado.</p>
          <p className="text-muted-foreground text-xs">
            Cadastre um profissional em &ldquo;Profissionais&rdquo; para ver a agenda aqui.
          </p>
        </div>
      ) : (
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
            const columnBlocks = dayBlocks.filter(
              (b) => (professional ? b.professionalId === professional.id : false),
            );
            const lanes = assignLanes(columnAppointments);

            return (
              <div key={professional?.id ?? "sem-profissional"} className="w-52 shrink-0 border-r last:border-r-0">
                <div className="h-10 truncate border-b px-2 py-2 text-sm font-medium">
                  {professional?.name ?? "Sem profissional"}
                </div>
                <div
                  className={`relative ${canCreate ? "cursor-crosshair" : ""}`}
                  style={{ height: gridHeight }}
                  onClick={(event) => handleColumnClick(professional?.id ?? null, event)}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-border/60 pointer-events-none absolute right-0 left-0 border-t"
                      style={{ top: (h * 60 - gridStartMinutes) * PX_PER_MINUTE }}
                    />
                  ))}
                  {showNowLine && nowTop >= 0 && nowTop <= gridHeight && (
                    <div
                      className="bg-destructive pointer-events-none absolute right-0 left-0 z-10 h-px"
                      style={{ top: nowTop }}
                    />
                  )}
                  {columnBlocks.map((b) => {
                    const start = new Date(b.startsAt);
                    const end = new Date(b.endsAt);
                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                    const durationMinutes = Math.max(
                      MIN_BLOCK_MINUTES,
                      (end.getTime() - start.getTime()) / 60000,
                    );
                    return (
                      <BlockCard
                        key={b.id}
                        block={b}
                        style={{
                          top: (startMinutes - gridStartMinutes) * PX_PER_MINUTE,
                          height: durationMinutes * PX_PER_MINUTE,
                          left: 0,
                          right: 0,
                        }}
                      />
                    );
                  })}
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
                    const editable = canManage && !["CANCELED", "NO_SHOW", "COMPLETED"].includes(a.status);

                    return (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        clientName={clientById.get(a.clientId)?.name ?? "—"}
                        serviceName={serviceById.get(a.serviceId)?.name ?? "—"}
                        canManage={canManage}
                        heightPx={heightPx}
                        onEdit={editable ? () => onAppointmentClick(a) : null}
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
      )}
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
  blocks,
  clients,
  professionals,
  services,
  resources,
  canManage,
  canCreate,
  onAppointmentClick,
}: {
  appointments: Appointment[];
  blocks: AppointmentBlock[];
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  resources: OperationalResource[];
  canManage: boolean;
  canCreate: boolean;
  /** Editar um agendamento - o dialogo em si vive no componente pai
   * (AppointmentsPanel), reaproveitado tambem pela visao Lista. */
  onAppointmentClick: (appointment: Appointment) => void;
}) {
  const [mode, setMode] = useState<"day" | "week">("day");
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [creatingSlot, setCreatingSlot] = useState<{ professionalId: string | null; startAt: Date } | null>(
    null,
  );
  // Vazio = mostra todos (comportamento de sempre). So passa a filtrar
  // quando o usuario desmarca alguem no menu "Profissionais".
  const [hiddenProfessionalIds, setHiddenProfessionalIds] = useState<Set<string>>(new Set());

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const professionalById = useMemo(
    () => new Map(professionals.map((p) => [p.id, p])),
    [professionals],
  );

  const visibleProfessionals = useMemo(
    () => professionals.filter((p) => !hiddenProfessionalIds.has(p.id)),
    [professionals, hiddenProfessionalIds],
  );
  const visibleAppointments = useMemo(
    () =>
      appointments.filter((a) => !a.professionalId || !hiddenProfessionalIds.has(a.professionalId)),
    [appointments, hiddenProfessionalIds],
  );

  function toggleProfessionalVisible(id: string) {
    setHiddenProfessionalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Users />
                Profissionais
                {hiddenProfessionalIds.size > 0 && (
                  <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 text-xs">
                    {professionals.length - hiddenProfessionalIds.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Mostrar na agenda</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {professionals.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p.id}
                  checked={!hiddenProfessionalIds.has(p.id)}
                  onCheckedChange={() => toggleProfessionalVisible(p.id)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {p.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate && (
            <Button
              size="sm"
              onClick={() =>
                setCreatingSlot({ professionalId: null, startAt: new Date(anchorDate.getTime() + 9 * 3600000) })
              }
            >
              Novo agendamento
            </Button>
          )}
        </div>
      </div>

      {mode === "day" ? (
        <>
          <p className="text-muted-foreground text-xs">
            {canCreate
              ? "Clique num horário vazio para agendar. Clique num agendamento para editar."
              : "Clique num agendamento para ver detalhes."}
          </p>
          <DayGrid
            date={anchorDate}
            appointments={visibleAppointments}
            blocks={blocks}
            professionals={visibleProfessionals}
            clientById={clientById}
            serviceById={serviceById}
            canManage={canManage}
            canCreate={canCreate}
            onSlotClick={(professionalId, startAt) => setCreatingSlot({ professionalId, startAt })}
            onAppointmentClick={onAppointmentClick}
          />
        </>
      ) : (
        <WeekAgenda
          weekStart={weekStart}
          appointments={visibleAppointments}
          professionalById={professionalById}
          clientById={clientById}
          serviceById={serviceById}
        />
      )}

      <EntityDialog
        title="Novo agendamento"
        description="Agende um horário para um cliente."
        open={creatingSlot !== null}
        onOpenChange={(open) => !open && setCreatingSlot(null)}
      >
        {({ close }) =>
          creatingSlot && (
            <AppointmentForm
              {...newAppointmentProps}
              defaultProfessionalId={creatingSlot.professionalId ?? undefined}
              defaultStartAt={creatingSlot.startAt.toISOString()}
              defaultEndAt={new Date(
                creatingSlot.startAt.getTime() + DEFAULT_CLICK_DURATION_MINUTES * 60000,
              ).toISOString()}
              onSuccess={() => {
                close();
                setCreatingSlot(null);
              }}
            />
          )
        }
      </EntityDialog>
    </div>
  );
}
