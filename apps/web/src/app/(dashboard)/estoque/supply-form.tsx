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
import type { SupplyItem } from "@/lib/api-types";
import { createSupply, updateSupply } from "./actions";

const supplySchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  baseUnit: z.string().min(1, "Informe a unidade base.").max(30),
  operationalUnit: z.string().max(30).optional().or(z.literal("")),
  unitCost: z.coerce.number().min(0).optional(),
  initialStock: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional(),
});

type SupplyInput = z.input<typeof supplySchema>;
type SupplyValues = z.output<typeof supplySchema>;

export function SupplyForm({
  existing,
  onSuccess,
}: {
  /** Quando presente, o formulario edita este insumo em vez de criar um novo. */
  existing?: SupplyItem;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplyInput, unknown, SupplyValues>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      name: existing?.name ?? "",
      baseUnit: existing?.baseUnit ?? "",
      operationalUnit: existing?.operationalUnit ?? "",
      unitCost: existing?.unitCost ?? undefined,
      initialStock: existing ? undefined : 0,
      minStock: existing?.minStock ?? undefined,
    },
  });

  async function onSubmit(values: SupplyValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = existing
        ? await updateSupply(existing.id, {
            name: values.name,
            baseUnit: values.baseUnit,
            operationalUnit: values.operationalUnit || undefined,
            unitCost: values.unitCost,
            minStock: values.minStock,
          })
        : await createSupply({
            name: values.name,
            baseUnit: values.baseUnit,
            operationalUnit: values.operationalUnit || undefined,
            unitCost: values.unitCost,
            initialStock: values.initialStock,
            minStock: values.minStock,
          });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Insumo atualizado." : "Insumo cadastrado.");
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
                <Input placeholder="Ex.: Água oxigenada 30 vol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="baseUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade base</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: ml, g, un" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operationalUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade operacional</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional (ex.: frasco)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo unitário (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.0001"
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
            name="minStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque mínimo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.001"
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
          <FormField
            control={form.control}
            name="initialStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque inicial</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.001"
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : existing ? "Salvar alterações" : "Cadastrar insumo"}
        </Button>
      </form>
    </Form>
  );
}
