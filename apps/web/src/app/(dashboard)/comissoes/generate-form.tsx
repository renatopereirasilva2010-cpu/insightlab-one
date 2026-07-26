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
import { formatCurrency } from "@/lib/format";
import type { Sale, Professional, Client } from "@/lib/api-types";
import { generateCommission } from "./actions";

const schema = z.object({
  saleId: z.string().min(1, "Selecione a venda."),
  professionalId: z.string().min(1, "Selecione o profissional."),
  baseAmount: z.coerce.number().min(0),
  commissionAmount: z.coerce.number().min(0),
});

type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

export function GenerateCommissionForm({
  sales,
  professionals,
  clients,
  onSuccess,
}: {
  sales: Sale[];
  professionals: Professional[];
  clients: Client[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { saleId: "", professionalId: "", baseAmount: 0, commissionAmount: 0 },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await generateCommission(values);

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Comissão gerada.");
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
          name="saleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venda</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  const sale = sales.find((s) => s.id === value);
                  if (sale) form.setValue("baseAmount", Number(sale.totalAmount));
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a venda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {(s.clientId && clientById.get(s.clientId)?.name) || "Sem cliente"} -{" "}
                      {formatCurrency(s.totalAmount)}
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
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
            name="baseAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base de cálculo (R$)</FormLabel>
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

          <FormField
            control={form.control}
            name="commissionAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da comissão (R$)</FormLabel>
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

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Gerar comissão"}
        </Button>
      </form>
    </Form>
  );
}
