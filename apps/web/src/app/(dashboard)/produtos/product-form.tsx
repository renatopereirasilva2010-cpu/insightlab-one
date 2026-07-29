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
import type { Product } from "@/lib/api-types";
import { createProduct, updateProduct } from "./actions";

const productSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  sku: z.string().max(80).optional().or(z.literal("")),
  salePrice: z.coerce.number().min(0, "Preço não pode ser negativo."),
  cost: z.coerce.number().min(0).optional(),
});

type ProductInput = z.input<typeof productSchema>;
type ProductValues = z.output<typeof productSchema>;

export function ProductForm({
  existing,
  onSuccess,
}: {
  /** Quando presente, o formulario edita este produto em vez de criar um novo. */
  existing?: Product;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductInput, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: existing?.name ?? "",
      sku: existing?.sku ?? "",
      salePrice: existing?.salePrice ?? 0,
      cost: existing?.cost ?? undefined,
    },
  });

  async function onSubmit(values: ProductValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        sku: values.sku || undefined,
        salePrice: values.salePrice,
        cost: values.cost,
      };

      const result = existing
        ? await updateProduct(existing.id, payload)
        : await createProduct(payload);

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Produto atualizado." : "Produto cadastrado.");
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
                <Input placeholder="Nome do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="Opcional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de venda (R$)</FormLabel>
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
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo (R$)</FormLabel>
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
          {isSubmitting
            ? "Salvando..."
            : existing
              ? "Salvar alterações"
              : "Cadastrar produto"}
        </Button>
      </form>
    </Form>
  );
}
