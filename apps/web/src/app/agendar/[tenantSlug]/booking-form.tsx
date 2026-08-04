"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { createPublicAppointment, fetchPublicAvailability } from "./actions";
import type { PublicService, PublicProfessional, PublicAvailabilityRule } from "./types";

const NONE = "__none__";

const WEEKDAY_LABELS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const bookingSchema = z
  .object({
    serviceId: z.string().min(1, "Selecione o serviço."),
    professionalId: z.string(),
    date: z.string().min(1, "Selecione a data."),
    time: z.string().min(1, "Selecione o horário."),
    clientName: z.string().min(2, "Informe seu nome."),
    clientPhone: z.string().min(8, "Informe um telefone válido."),
    clientEmail: z.string().email("E-mail inválido.").optional().or(z.literal("")),
    notes: z.string().max(500).optional().or(z.literal("")),
    acceptedPrivacyPolicy: z.boolean().refine((v) => v === true, {
      message: "É necessário aceitar a Política de Privacidade para agendar.",
    }),
  })
  .refine((v) => !!v.date && !!v.time, {
    message: "Selecione data e horário.",
    path: ["time"],
  });

type BookingValues = z.infer<typeof bookingSchema>;

export function BookingForm({
  tenantSlug,
  services,
  professionals,
}: {
  tenantSlug: string;
  services: PublicService[];
  professionals: PublicProfessional[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [availabilityHint, setAvailabilityHint] = useState<string | null>(null);

  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: "",
      professionalId: NONE,
      date: "",
      time: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      notes: "",
      acceptedPrivacyPolicy: false,
    },
  });

  const serviceId = form.watch("serviceId");
  const professionalId = form.watch("professionalId");
  const date = form.watch("date");
  const selectedService = services.find((s) => s.id === serviceId);

  useEffect(() => {
    if (!professionalId || professionalId === NONE || !date) {
      setAvailabilityHint(null);
      return;
    }

    const weekday = new Date(`${date}T00:00:00`).getDay();

    fetchPublicAvailability(tenantSlug, professionalId, weekday).then((result) => {
      if (!result.ok) {
        setAvailabilityHint(null);
        return;
      }

      const rules: PublicAvailabilityRule[] = result.data.rules;
      if (rules.length === 0) {
        setAvailabilityHint(`Sem horário cadastrado para ${WEEKDAY_LABELS[weekday]}.`);
        return;
      }

      const ranges = rules.map((r) => `${r.startTime} às ${r.endTime}`).join(", ");
      setAvailabilityHint(`Disponível ${WEEKDAY_LABELS[weekday]}: ${ranges}`);
    });
  }, [tenantSlug, professionalId, date]);

  async function onSubmit(values: BookingValues) {
    if (selectedService?.requiresProfessional && values.professionalId === NONE) {
      form.setError("professionalId", { message: "Este serviço exige um profissional." });
      return;
    }

    setServerError(null);
    setIsSubmitting(true);
    try {
      const startAt = new Date(`${values.date}T${values.time}:00`).toISOString();

      const result = await createPublicAppointment(tenantSlug, {
        clientName: values.clientName,
        clientPhone: values.clientPhone,
        clientEmail: values.clientEmail || undefined,
        serviceId: values.serviceId,
        professionalId:
          values.professionalId === NONE ? undefined : values.professionalId,
        startAt,
        notes: values.notes || undefined,
        acceptedPrivacyPolicy: values.acceptedPrivacyPolicy,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      setConfirmed(true);
      toast.success("Agendamento confirmado!");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="space-y-2 py-6 text-center">
        <p className="text-lg font-medium">Agendamento confirmado!</p>
        <p className="text-muted-foreground text-sm">
          Você vai receber a confirmação com os detalhes do seu horário.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
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
                  {!selectedService?.requiresProfessional && (
                    <SelectItem value={NONE}>Sem preferência</SelectItem>
                  )}
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" min={new Date().toISOString().slice(0, 10)} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {availabilityHint && (
          <p className="text-muted-foreground text-sm">{availabilityHint}</p>
        )}

        <div className="space-y-2 border-t pt-4">
          <Label className="text-sm font-medium">Seus dados</Label>

          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone / WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail (opcional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="voce@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Alguma preferência ou observação?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptedPrivacyPolicy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">
                  Li e aceito a{" "}
                  <Link href="/privacidade" target="_blank" className="underline">
                    Política de Privacidade
                  </Link>
                  .
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          style={{ backgroundColor: "var(--mix-gold)" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Agendando..." : "Confirmar agendamento"}
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          <Link href={`/agendar/${tenantSlug}/meus-dados`} className="underline">
            Solicitar acesso, correção ou exclusão dos meus dados
          </Link>
        </p>
      </form>
    </Form>
  );
}
