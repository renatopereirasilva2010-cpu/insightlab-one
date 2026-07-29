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
import { createRole } from "./role-actions";

const roleSchema = z.object({
  code: z
    .string()
    .min(1, "Informe o código.")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Use letras maiúsculas, números e underscore."),
  name: z.string().min(1, "Informe o nome.").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

type RoleValues = z.infer<typeof roleSchema>;

export function RoleForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { code: "", name: "", description: "" },
  });

  async function onSubmit(values: RoleValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createRole({
        code: values.code,
        name: values.name,
        description: values.description || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Papel cadastrado.");
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: GERENTE" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Gerente" {...field} />
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
          {isSubmitting ? "Salvando..." : "Cadastrar papel"}
        </Button>
      </form>
    </Form>
  );
}
