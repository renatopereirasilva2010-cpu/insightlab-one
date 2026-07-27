"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import type { Client, Professional } from "@/lib/api-types";
import { createSale } from "./actions";

const NONE = "__none__";

const saleSchema = z.object({
  clientId: z.string().min(1, "Selecione o cliente."),
  professionalId: z.string(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type SaleValues = z.infer<typeof saleSchema>;

export function SaleForm({
  clients,
  professionals,
  onSuccess,
}: {
  clients: Client[];
  professionals: Professional[];
  onSuccess: (saleId: string) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: { clientId: "", professionalId: NONE, notes: "" },
  });

  async function onSubmit(values: SaleValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createSale({
        clientId: values.clientId,
        professionalId: values.professionalId === NONE ? undefined : values.professionalId,
        notes: values.notes || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Venda criada. Adicione itens em seguida.");
      router.refresh();
      onSuccess(result.data.id);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
                    <SelectValue placeholder="Sem preferência" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>Sem preferência</SelectItem>
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
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
          {isSubmitting ? "Salvando..." : "Criar venda"}
        </Button>
      </form>
    </Form>
  );
}
