"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ServiceCatalogItem } from "@/lib/api-types";
import { updateServiceFiscal } from "./actions";

const fiscalSchema = z
  .object({
    cnaeCode: z
      .string()
      .regex(/^\d{7}$/, "CNAE deve ter exatamente 7 dígitos.")
      .optional()
      .or(z.literal("")),
    serviceListItemCode: z.string().max(20).optional().or(z.literal("")),
    issRate: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((v) => v.cnaeCode || v.serviceListItemCode || v.issRate !== undefined, {
    message: "Preencha ao menos um campo fiscal.",
    path: ["cnaeCode"],
  });

type FiscalInput = z.input<typeof fiscalSchema>;
type FiscalValues = z.output<typeof fiscalSchema>;

export function ServiceFiscalForm({
  service,
  onSuccess,
}: {
  service: ServiceCatalogItem;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FiscalInput, unknown, FiscalValues>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      cnaeCode: service.cnaeCode ?? "",
      serviceListItemCode: service.serviceListItemCode ?? "",
      issRate: service.issRate ?? undefined,
    },
  });

  async function onSubmit(values: FiscalValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await updateServiceFiscal(service.id, {
        cnaeCode: values.cnaeCode || undefined,
        serviceListItemCode: values.serviceListItemCode || undefined,
        issRate: values.issRate,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Dados fiscais atualizados.");
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
          name="serviceListItemCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item da lista de serviços</FormLabel>
              <FormControl>
                <Input {...field} />
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

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar dados fiscais"}
        </Button>
      </form>
    </Form>
  );
}
