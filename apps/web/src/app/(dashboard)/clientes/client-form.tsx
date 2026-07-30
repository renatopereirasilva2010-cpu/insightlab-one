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
import { PhotoUploadField } from "@/components/photo-upload-field";
import type { Client } from "@/lib/api-types";
import { createClient, updateClient, uploadClientPhoto } from "./actions";

const clientSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido.").max(150).optional().or(z.literal("")),
  socialName: z.string().max(150).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
});

type ClientValues = z.infer<typeof clientSchema>;

export function ClientForm({
  existing,
  onSuccess,
}: {
  /** Quando presente, o formulario edita este cliente em vez de criar um novo. */
  existing?: Client;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: existing?.name ?? "",
      phone: existing?.phone ?? "",
      email: existing?.email ?? "",
      socialName: existing?.socialName ?? "",
      source: existing?.source ?? "",
    },
  });

  async function onSubmit(values: ClientValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        socialName: values.socialName || undefined,
        source: values.source || undefined,
      };

      const result = existing
        ? await updateClient(existing.id, payload)
        : await createClient(payload);

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Cliente atualizado." : "Cliente cadastrado.");
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
        {existing && (
          <PhotoUploadField
            name={existing.name}
            currentPhotoUrl={existing.photoUrl}
            uploadAction={(formData) => uploadClientPhoto(existing.id, formData)}
          />
        )}

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
          name="socialName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome social</FormLabel>
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
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origem</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Instagram, indicação" {...field} />
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
          {isSubmitting
            ? "Salvando..."
            : existing
              ? "Salvar alterações"
              : "Cadastrar cliente"}
        </Button>
      </form>
    </Form>
  );
}
