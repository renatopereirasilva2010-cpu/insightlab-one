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
import type { UserListItem } from "@/lib/api-types";
import { createUser, updateUser } from "./user-actions";

const userSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  socialName: z.string().max(150).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido.").max(150),
  password: z.string().min(8, "Mínimo 8 caracteres.").or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
});

type UserValues = z.infer<typeof userSchema>;

export function UserForm({
  existing,
  onSuccess,
}: {
  /** Quando presente, o formulario edita este usuario em vez de criar um novo.
   * E-mail e senha nao sao editaveis por aqui - apenas na criacao. */
  existing?: UserListItem;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: existing?.name ?? "",
      socialName: existing?.socialName ?? "",
      email: existing?.email ?? "",
      password: "",
      phone: "",
    },
  });

  async function onSubmit(values: UserValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = existing
        ? await updateUser(existing.id, {
            name: values.name,
            socialName: values.socialName || undefined,
            phone: values.phone || undefined,
          })
        : await createUser({
            name: values.name,
            socialName: values.socialName || undefined,
            email: values.email,
            password: values.password,
            phone: values.phone || undefined,
          });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Usuário atualizado." : "Usuário cadastrado.");
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
          name="socialName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome social</FormLabel>
              <FormControl>
                <Input placeholder="Opcional — usado no lugar do nome acima em toda a tela" {...field} />
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
                <Input type="email" placeholder="voce@empresa.com" disabled={!!existing} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!existing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
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
          {isSubmitting
            ? "Salvando..."
            : existing
              ? "Salvar alterações"
              : "Cadastrar usuário"}
        </Button>
      </form>
    </Form>
  );
}
