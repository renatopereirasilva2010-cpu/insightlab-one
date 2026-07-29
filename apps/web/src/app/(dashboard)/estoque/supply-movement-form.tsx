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
import type { SupplyItem, SupplyMovementType } from "@/lib/api-types";
import { registerSupplyMovement } from "./actions";

const movementTypeLabels: Record<SupplyMovementType, string> = {
  ENTRY: "Entrada",
  SALE_CONSUMPTION: "Saída (venda)",
  INTERNAL_USE: "Saída (uso interno)",
  ADJUSTMENT: "Ajuste",
};

const movementSchema = z.object({
  type: z.enum(["ENTRY", "SALE_CONSUMPTION", "INTERNAL_USE", "ADJUSTMENT"]),
  quantity: z.coerce.number().refine((v) => v !== 0, "Informe uma quantidade diferente de zero."),
  unit: z.string().min(1, "Selecione a unidade."),
  reason: z.string().max(300).optional().or(z.literal("")),
});

type MovementInput = z.input<typeof movementSchema>;
type MovementValues = z.output<typeof movementSchema>;

export function SupplyMovementForm({
  supplyItem,
  onSuccess,
}: {
  supplyItem: SupplyItem;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MovementInput, unknown, MovementValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: "ENTRY",
      quantity: undefined,
      unit: supplyItem.baseUnit,
      reason: "",
    },
  });

  const type = form.watch("type");

  async function onSubmit(values: MovementValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await registerSupplyMovement(supplyItem.id, {
        type: values.type,
        quantity: values.quantity,
        unit: values.unit,
        reason: values.reason || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Movimento registrado.");
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de movimento</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(movementTypeLabels).map(([value, label]) => (
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                {type === "ADJUSTMENT" && (
                  <p className="text-muted-foreground text-xs">
                    Use valor negativo para corrigir o estoque para baixo.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                {supplyItem.operationalUnit ? (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={supplyItem.baseUnit}>{supplyItem.baseUnit}</SelectItem>
                      <SelectItem value={supplyItem.operationalUnit}>
                        {supplyItem.operationalUnit}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo / observação</FormLabel>
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
          {isSubmitting ? "Registrando..." : "Registrar movimento"}
        </Button>
      </form>
    </Form>
  );
}
