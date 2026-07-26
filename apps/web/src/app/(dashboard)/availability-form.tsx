"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { ProfessionalAvailability } from "@/lib/api-types";
import { createAvailability, updateAvailability } from "./actions";

const WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const availabilitySchema = z
  .object({
    weekday: z.string().min(1),
    startTime: z.string().regex(TIME_RE, "Use o formato HH:mm."),
    endTime: z.string().regex(TIME_RE, "Use o formato HH:mm."),
    active: z.boolean(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "O término deve ser depois do início.",
    path: ["endTime"],
  });

type AvailabilityValues = z.infer<typeof availabilitySchema>;

export function AvailabilityForm({
  professionalId,
  existing,
  onSuccess,
}: {
  professionalId: string;
  existing?: ProfessionalAvailability;
  onSuccess: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      weekday: existing ? String(existing.weekday) : "1",
      startTime: existing?.startTime ?? "09:00",
      endTime: existing?.endTime ?? "18:00",
      active: existing?.active ?? true,
    },
  });

  async function onSubmit(values: AvailabilityValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = existing
        ? await updateAvailability(existing.id, {
            weekday: Number(values.weekday),
            startTime: values.startTime,
            endTime: values.endTime,
            active: values.active,
          })
        : await createAvailability({
            professionalId,
            weekday: Number(values.weekday),
            startTime: values.startTime,
            endTime: values.endTime,
            active: values.active,
          });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Regra atualizada." : "Regra de disponibilidade criada.");
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
          name="weekday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dia da semana</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WEEKDAYS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
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
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Ativa</FormLabel>
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : existing ? "Salvar alterações" : "Criar regra"}
        </Button>
      </form>
    </Form>
  );
}
