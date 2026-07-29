"use client";

import { useState } from "react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { ServiceCatalogItem } from "@/lib/api-types";
import { createService, updateService } from "./actions";

const serviceSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  description: z.string().max(500).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(1, "Mínimo 1 minuto."),
  price: z.coerce.number().min(0, "Preço não pode ser negativo."),
  cnaeCode: z
    .string()
    .regex(/^\d{7}$/, "CNAE deve ter exatamente 7 dígitos.")
    .optional()
    .or(z.literal("")),
  serviceListItemCode: z.string().max(20).optional().or(z.literal("")),
  issRate: z.coerce.number().min(0).max(100).optional(),
  availableOnline: z.boolean(),
});

type ServiceInput = z.input<typeof serviceSchema>;
type ServiceValues = z.output<typeof serviceSchema>;

export function ServiceForm({
  existing,
  onSuccess,
}: {
  /** Quando presente, o formulario edita este servico em vez de criar um novo.
   * CNAE, item da lista de servicos e aliquota de ISS continuam exclusivos do
   * dialogo "Fiscal" - o endpoint geral de update nao aceita esses campos. */
  existing?: ServiceCatalogItem;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceInput, unknown, ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      durationMinutes: existing?.durationMinutes ?? 30,
      price: existing?.price ?? 0,
      cnaeCode: existing?.cnaeCode ?? "",
      serviceListItemCode: existing?.serviceListItemCode ?? "",
      issRate: existing?.issRate ?? undefined,
      availableOnline: existing?.availableOnline ?? true,
    },
  });

  async function onSubmit(values: ServiceValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = existing
        ? await updateService(existing.id, {
            name: values.name,
            description: values.description || undefined,
            durationMinutes: values.durationMinutes,
            price: values.price,
            availableOnline: values.availableOnline,
          })
        : await createService({
            name: values.name,
            description: values.description || undefined,
            durationMinutes: values.durationMinutes,
            price: values.price,
            cnaeCode: values.cnaeCode || undefined,
            serviceListItemCode: values.serviceListItemCode || undefined,
            issRate: values.issRate,
            availableOnline: values.availableOnline,
          });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Serviço atualizado." : "Serviço cadastrado.");
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Corte feminino" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Opcional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!existing && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnaeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNAE</FormLabel>
                    <FormControl>
                      <Input placeholder="7 dígitos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alíquota ISS (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        {...field}
                        value={(field.value as number | string | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceListItemCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item da lista de serviços</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="availableOnline"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Disponível para agendamento online</FormLabel>
                <FormDescription>Aparece no fluxo de agendamento pelo cliente.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {existing && (
          <p className="text-muted-foreground text-xs">
            CNAE, item da lista de serviços e alíquota de ISS ficam no botão &quot;Fiscal&quot;.
          </p>
        )}

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando..."
            : existing
              ? "Salvar alterações"
              : "Cadastrar serviço"}
        </Button>
      </form>
    </Form>
  );
}
