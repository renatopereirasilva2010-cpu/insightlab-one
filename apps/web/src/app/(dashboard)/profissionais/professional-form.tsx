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
import { createProfessional } from "./actions";

const professionalSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  roleTitle: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido.").max(150).optional().or(z.literal("")),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
});

type ProfessionalInput = z.input<typeof professionalSchema>;
type ProfessionalValues = z.output<typeof professionalSchema>;

export function ProfessionalForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfessionalInput, unknown, ProfessionalValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", roleTitle: "", phone: "", email: "", commissionRate: undefined },
  });

  async function onSubmit(values: ProfessionalValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createProfessional({
        name: values.name,
        roleTitle: values.roleTitle || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        commissionRate: values.commissionRate,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Profissional cadastrado.");
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
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roleTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Cabeleireiro(a), Esteticista" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 90000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="commissionRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentual de comissão (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="Ex.: 30"
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
          {isSubmitting ? "Salvando..." : "Cadastrar profissional"}
        </Button>
      </form>
    </Form>
  );
}
