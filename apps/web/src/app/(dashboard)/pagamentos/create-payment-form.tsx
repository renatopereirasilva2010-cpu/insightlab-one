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
import { paymentMethodLabels } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import type { Sale, Client } from "@/lib/api-types";
import { createPayment } from "../vendas/actions";

const paymentSchema = z.object({
  saleId: z.string().min(1, "Selecione a venda."),
  method: z.enum(["CASH", "PIX", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "DEFERRED"]),
  amount: z.coerce.number().min(0.01, "Informe um valor válido."),
});

type PaymentInput = z.input<typeof paymentSchema>;
type PaymentValues = z.output<typeof paymentSchema>;

export function CreatePaymentForm({
  eligibleSales,
  clients,
  onSuccess,
}: {
  eligibleSales: Sale[];
  clients: Client[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const form = useForm<PaymentInput, unknown, PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { saleId: "", method: "CASH", amount: 0 },
  });

  async function onSubmit(values: PaymentValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createPayment({
        saleId: values.saleId,
        method: values.method,
        amount: values.amount,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Pagamento registrado.");
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
                  const sale = eligibleSales.find((s) => s.id === value);
                  if (sale) form.setValue("amount", Number(sale.totalAmount));
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a venda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eligibleSales.map((s) => (
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
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0.01}
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
          {isSubmitting ? "Salvando..." : "Registrar pagamento"}
        </Button>
      </form>
    </Form>
  );
}
