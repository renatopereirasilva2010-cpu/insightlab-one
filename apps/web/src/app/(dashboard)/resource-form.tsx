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
import { createResource } from "./actions";

const resourceSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  type: z.string().min(1, "Informe o tipo.").max(50),
  description: z.string().max(300).optional().or(z.literal("")),
});

type ResourceValues = z.infer<typeof resourceSchema>;

export function ResourceForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResourceValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { name: "", type: "", description: "" },
  });

  async function onSubmit(values: ResourceValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createResource({
        name: values.name,
        type: values.type,
        description: values.description || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Recurso cadastrado.");
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
                <Input placeholder="Ex.: Sala 1, Cadeira 2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: sala, cadeira, equipamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          {isSubmitting ? "Salvando..." : "Cadastrar recurso"}
        </Button>
      </form>
    </Form>
  );
}
