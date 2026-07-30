"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EntityAvatar } from "@/components/entity-avatar";
import type { Appointment, Client, Professional, ServiceCatalogItem, OperationalResource } from "@/lib/api-types";
import { createAppointment, updateAppointment, suggestAppointmentSlots } from "./actions";

const NONE = "__none__";

/** Converte um ISO (UTC) pro formato local que o input datetime-local espera (YYYY-MM-DDTHH:mm). */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSlotLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const appointmentSchema = z
  .object({
    clientId: z.string().min(1, "Selecione o cliente."),
    professionalId: z.string(),
    serviceId: z.string().min(1, "Selecione o serviço."),
    resourceId: z.string(),
    startAt: z.string().min(1, "Informe o início."),
    endAt: z.string().min(1, "Informe o término."),
    isWalkIn: z.boolean(),
    isOverbook: z.boolean(),
    notes: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((v) => new Date(v.endAt) > new Date(v.startAt), {
    message: "O término deve ser depois do início.",
    path: ["endAt"],
  });

type AppointmentValues = z.infer<typeof appointmentSchema>;

export function AppointmentForm({
  clients,
  professionals,
  services,
  resources,
  existing,
  defaultProfessionalId,
  defaultStartAt,
  defaultEndAt,
  onSuccess,
}: {
  clients: Client[];
  professionals: Professional[];
  services: ServiceCatalogItem[];
  resources: OperationalResource[];
  /** Quando presente, o formulario edita este agendamento em vez de criar um novo. */
  existing?: Appointment;
  /** Prefill vindo de um clique num horario vazio do calendario (so no modo criacao). */
  defaultProfessionalId?: string;
  defaultStartAt?: string;
  defaultEndAt?: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ startAt: string; endAt: string }[]>([]);

  const form = useForm<AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: existing?.clientId ?? "",
      professionalId: existing?.professionalId ?? defaultProfessionalId ?? NONE,
      serviceId: existing?.serviceId ?? "",
      resourceId: existing?.resourceId ?? NONE,
      startAt: existing ? toDatetimeLocalValue(existing.startAt) : defaultStartAt ? toDatetimeLocalValue(defaultStartAt) : "",
      endAt: existing ? toDatetimeLocalValue(existing.endAt) : defaultEndAt ? toDatetimeLocalValue(defaultEndAt) : "",
      isWalkIn: existing?.isWalkIn ?? false,
      isOverbook: existing?.isOverbook ?? false,
      notes: existing?.notes ?? "",
    },
  });

  const serviceId = form.watch("serviceId");
  const professionalId = form.watch("professionalId");

  useEffect(() => {
    if (!serviceId || professionalId === NONE) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    suggestAppointmentSlots(professionalId, serviceId).then((result) => {
      if (cancelled) return;
      setSuggestions(result.ok ? result.data.suggestions : []);
    });

    return () => {
      cancelled = true;
    };
  }, [serviceId, professionalId]);

  function applySuggestion(slot: { startAt: string; endAt: string }) {
    form.setValue("startAt", toDatetimeLocalValue(slot.startAt), { shouldValidate: true });
    form.setValue("endAt", toDatetimeLocalValue(slot.endAt), { shouldValidate: true });
  }

  /** Ao trocar o serviço manualmente (fora de uma sugestão), ajusta o
   * término pra bater com a duração do novo serviço, mantendo o início. */
  function handleServiceChange(newServiceId: string) {
    form.setValue("serviceId", newServiceId, { shouldValidate: true });
    const startAtValue = form.getValues("startAt");
    if (!startAtValue) return;
    const service = services.find((s) => s.id === newServiceId);
    if (!service) return;
    const start = new Date(startAtValue);
    const end = new Date(start.getTime() + service.durationMinutes * 60_000);
    form.setValue("endAt", toDatetimeLocalValue(end.toISOString()), { shouldValidate: true });
  }

  async function onSubmit(values: AppointmentValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = existing
        ? await updateAppointment(existing.id, {
            clientId: values.clientId,
            professionalId: values.professionalId === NONE ? undefined : values.professionalId,
            serviceId: values.serviceId,
            resourceId: values.resourceId === NONE ? undefined : values.resourceId,
            startAt: new Date(values.startAt).toISOString(),
            endAt: new Date(values.endAt).toISOString(),
            isOverbook: values.isOverbook,
            notes: values.notes || undefined,
          })
        : await createAppointment({
            clientId: values.clientId,
            professionalId: values.professionalId === NONE ? undefined : values.professionalId,
            serviceId: values.serviceId,
            resourceId: values.resourceId === NONE ? undefined : values.resourceId,
            startAt: new Date(values.startAt).toISOString(),
            endAt: new Date(values.endAt).toISOString(),
            isWalkIn: values.isWalkIn,
            isOverbook: values.isOverbook,
            notes: values.notes || undefined,
          });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Agendamento atualizado." : "Agendamento criado.");
      form.reset();
      router.refresh();
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <EntityAvatar name={c.name} photoUrl={c.photoUrl} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select value={field.value} onValueChange={handleServiceChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="professionalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profissional</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem preferência" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>Sem preferência</SelectItem>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <EntityAvatar name={p.name} photoUrl={p.photoUrl} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resourceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurso (sala/cadeira)</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum</SelectItem>
                  {resources.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Sugestões de horário</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((slot) => (
                <Button
                  key={slot.startAt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion(slot)}
                >
                  {formatSlotLabel(slot.startAt)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="isWalkIn"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Walk-in</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isOverbook"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Permitir overbooking</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Opcional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : existing ? "Salvar alterações" : "Criar agendamento"}
        </Button>
      </form>
    </Form>
  );
}
