"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { paymentMethodLabels } from "@/components/status-badge";
import type { CashRegister } from "@/lib/api-types";
import { createPayment } from "../actions";

const NONE = "__none__";

const paymentSchema = z
  .object({
    method: z.enum(["CASH", "PIX", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "DEFERRED"]),
    amount: z.coerce.number().min(0.01, "Informe um valor válido."),
    cashRegisterId: z.string(),
    isDeferred: z.boolean(),
    deferredDueDate: z.string().optional().or(z.literal("")),
    externalReference: z.string().max(120).optional().or(z.literal("")),
    notes: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((v) => !(v.isDeferred && !v.deferredDueDate), {
    message: "Informe a data de vencimento para pagamento diferido.",
    path: ["deferredDueDate"],
  });

type PaymentInput = z.input<typeof paymentSchema>;
type PaymentValues = z.output<typeof paymentSchema>;

export function PaymentForm({
  saleId,
  defaultAmount,
  openRegisters,
  onSuccess,
}: {
  saleId: string;
  defaultAmount: number;
  openRegisters: CashRegister[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentInput, unknown, PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "CASH",
      amount: defaultAmount,
      cashRegisterId: NONE,
      isDeferred: false,
      deferredDueDate: "",
      externalReference: "",
      notes: "",
    },
  });

  const method = form.watch("method");

  async function onSubmit(values: PaymentValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createPayment({
        saleId,
        method: values.method,
        amount: values.amount,
        cashRegisterId: values.cashRegisterId === NONE ? undefined : values.cashRegisterId,
        isDeferred: values.isDeferred || values.method === "DEFERRED",
        deferredDueDate: values.deferredDueDate || undefined,
        externalReference: values.externalReference || undefined,
        notes: values.notes || undefined,
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

        <FormField
          control={form.control}
          name="cashRegisterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caixa</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum</SelectItem>
                  {openRegisters.map((r) => (
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

        {method !== "DEFERRED" && (
          <FormField
            control={form.control}
            name="isDeferred"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Pagamento diferido</FormLabel>
              </FormItem>
            )}
          />
        )}

        {(method === "DEFERRED" || form.watch("isDeferred")) && (
          <FormField
            control={form.control}
            name="deferredDueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="externalReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referência externa</FormLabel>
              <FormControl>
                <Input placeholder="Opcional - ex.: NSU da maquininha" {...field} />
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
