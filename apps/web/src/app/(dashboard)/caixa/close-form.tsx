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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { closeCashRegister } from "./actions";

const closeSchema = z.object({
  closingBalance: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type CloseInput = z.input<typeof closeSchema>;
type CloseValues = z.output<typeof closeSchema>;

export function CloseCashRegisterForm({
  registerId,
  onSuccess,
}: {
  registerId: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CloseInput, unknown, CloseValues>({
    resolver: zodResolver(closeSchema),
    defaultValues: { closingBalance: undefined, notes: "" },
  });

  async function onSubmit(values: CloseValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await closeCashRegister(registerId, {
        closingBalance: values.closingBalance,
        notes: values.notes || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Caixa fechado.");
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
          name="closingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo de fechamento (R$)</FormLabel>
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações do fechamento</FormLabel>
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

        <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Fechar caixa"}
        </Button>
      </form>
    </Form>
  );
}
