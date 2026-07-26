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
import type { ServiceCatalogItem, Product } from "@/lib/api-types";
import { addSaleItem } from "../actions";

const itemSchema = z
  .object({
    itemType: z.enum(["SERVICE", "PRODUCT"]),
    itemId: z.string().min(1, "Selecione um item."),
    description: z.string().max(300).optional().or(z.literal("")),
    quantity: z.coerce.number().min(0.001, "Quantidade deve ser maior que zero."),
    unitPrice: z.coerce.number().min(0, "Preço não pode ser negativo."),
  });

type ItemInput = z.input<typeof itemSchema>;
type ItemValues = z.output<typeof itemSchema>;

export function SaleItemForm({
  saleId,
  services,
  products,
  onSuccess,
}: {
  saleId: string;
  services: ServiceCatalogItem[];
  products: Product[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ItemInput, unknown, ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { itemType: "SERVICE", itemId: "", description: "", quantity: 1, unitPrice: 0 },
  });

  const itemType = form.watch("itemType");
  const options = itemType === "SERVICE" ? services : products;

  async function onSubmit(values: ItemValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await addSaleItem(saleId, {
        itemType: values.itemType,
        serviceId: values.itemType === "SERVICE" ? values.itemId : undefined,
        productId: values.itemType === "PRODUCT" ? values.itemId : undefined,
        description: values.description || undefined,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Item adicionado.");
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
          name="itemType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("itemId", "");
                  form.setValue("unitPrice", 0);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SERVICE">Serviço</SelectItem>
                  <SelectItem value="PRODUCT">Produto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{itemType === "SERVICE" ? "Serviço" : "Produto"}</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (itemType === "SERVICE") {
                    const svc = services.find((s) => s.id === value);
                    if (svc) form.setValue("unitPrice", svc.price);
                  } else {
                    const prod = products.find((p) => p.id === value);
                    if (prod) form.setValue("unitPrice", prod.salePrice);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
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
                    min={0.001}
                    step="0.001"
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
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço unitário (R$)</FormLabel>
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Opcional" {...field} />
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
          {isSubmitting ? "Salvando..." : "Adicionar item"}
        </Button>
      </form>
    </Form>
  );
}
