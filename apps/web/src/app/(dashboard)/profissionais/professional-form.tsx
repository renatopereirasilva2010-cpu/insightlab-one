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
import { PhotoUploadField } from "@/components/photo-upload-field";
import type { Professional } from "@/lib/api-types";
import { createProfessional, updateProfessional, uploadProfessionalPhoto } from "./actions";

const NONE = "__none__";

const pixKeyTypeLabels: Record<string, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  RANDOM: "Chave aleatória",
};

const professionalSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(150),
  roleTitle: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido.").max(150).optional().or(z.literal("")),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  payoutPixKey: z.string().max(150).optional().or(z.literal("")),
  payoutPixKeyType: z.string(),
});

type ProfessionalInput = z.input<typeof professionalSchema>;
type ProfessionalValues = z.output<typeof professionalSchema>;

export function ProfessionalForm({
  existing,
  onSuccess,
}: {
  /** Quando presente, o formulario edita este profissional em vez de criar um novo. */
  existing?: Professional;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfessionalInput, unknown, ProfessionalValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: existing?.name ?? "",
      roleTitle: existing?.roleTitle ?? "",
      phone: existing?.phone ?? "",
      email: existing?.email ?? "",
      commissionRate: existing?.commissionRate ?? undefined,
      payoutPixKey: existing?.payoutPixKey ?? "",
      payoutPixKeyType: existing?.payoutPixKeyType ?? NONE,
    },
  });

  async function onSubmit(values: ProfessionalValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        roleTitle: values.roleTitle || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        commissionRate: values.commissionRate,
        payoutPixKey: values.payoutPixKey || undefined,
        payoutPixKeyType:
          values.payoutPixKeyType === NONE
            ? undefined
            : (values.payoutPixKeyType as Professional["payoutPixKeyType"] & string),
      };

      const result = existing
        ? await updateProfessional(existing.id, payload)
        : await createProfessional(payload);

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success(existing ? "Profissional atualizado." : "Profissional cadastrado.");
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
            uploadAction={(formData) => uploadProfessionalPhoto(existing.id, formData)}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payoutPixKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave PIX para repasse</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payoutPixKeyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo da chave</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>Não informado</SelectItem>
                    {Object.entries(pixKeyTypeLabels).map(([value, label]) => (
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
              : "Cadastrar profissional"}
        </Button>
      </form>
    </Form>
  );
}
