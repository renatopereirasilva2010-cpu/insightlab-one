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
import type { Sale, Professional, Client, ServiceCatalogItem, Product } from "@/lib/api-types";
import { generateCommission } from "./actions";

const schema = z.object({
  saleItemId: z.string().min(1, "Selecione o item da venda."),
  baseAmount: z.coerce.number().min(0),
});

type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

export function GenerateCommissionForm({
  sales,
  professionals,
  clients,
  services,
  products,
  onSuccess,
}: {
  sales: Sale[];
  professionals: Professional[];
  clients: Client[];
  services: ServiceCatalogItem[];
  products: Product[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const professionalById = new Map(professionals.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const productById = new Map(products.map((p) => [p.id, p]));

  const commissionableItems = sales.flatMap((sale) =>
    sale.items
      .filter((item) => item.professionalId)
      .map((item) => ({ sale, item })),
  );

  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { saleItemId: "", baseAmount: 0 },
  });

  const selected = commissionableItems.find((c) => c.item.id === form.watch("saleItemId"));
  const selectedProfessional = selected ? professionalById.get(selected.item.professionalId!) : undefined;
  const baseAmount = Number(form.watch("baseAmount")) || 0;
  const commissionRate = selectedProfessional?.commissionRate ?? null;
  const estimatedCommission =
    commissionRate !== null ? Math.round(baseAmount * commissionRate) / 100 : null;

  function describeItem(item: (typeof commissionableItems)[number]["item"]) {
    if (item.description) return item.description;
    if (item.itemType === "SERVICE") return serviceById.get(item.serviceId ?? "")?.name ?? "Serviço";
    return productById.get(item.productId ?? "")?.name ?? "Produto";
  }

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
          name="saleItemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item da venda</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  const entry = commissionableItems.find((c) => c.item.id === value);
                  if (entry) form.setValue("baseAmount", Number(entry.item.totalPrice));
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commissionableItems.map(({ sale, item }) => (
                    <SelectItem key={item.id} value={item.id}>
                      {(sale.clientId && clientById.get(sale.clientId)?.name) || "Sem cliente"} ·{" "}
                      {describeItem(item)} ·{" "}
                      {professionalById.get(item.professionalId!)?.name} ·{" "}
                      {formatCurrency(item.totalPrice)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {commissionableItems.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Nenhum item de venda com profissional responsável definido ainda. Defina o
                  profissional no item da venda antes de gerar a comissão.
                </p>
              )}
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

          <FormItem>
            <FormLabel>Valor da comissão (calculado)</FormLabel>
            <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
              {selected === undefined
                ? "Selecione o item"
                : commissionRate === null
                  ? "Profissional sem percentual configurado"
                  : `${formatCurrency(estimatedCommission ?? 0)} (${commissionRate}%)`}
            </div>
          </FormItem>
        </div>

        {serverError && (
          <p className="text-destructive text-sm" role="alert">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || (selected !== undefined && commissionRate === null)}
        >
          {isSubmitting ? "Salvando..." : "Gerar comissão"}
        </Button>
      </form>
    </Form>
  );
}
