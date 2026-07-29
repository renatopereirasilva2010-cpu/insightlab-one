"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createDataSubjectRequest } from "../actions";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: "Acesso aos meus dados",
  CORRECTION: "Correção dos meus dados",
  DELETION: "Exclusão dos meus dados",
  PORTABILITY: "Portabilidade dos meus dados",
  CONSENT_REVOCATION: "Revogar meu consentimento",
};

const requestSchema = z.object({
  requesterName: z.string().min(2, "Informe seu nome.").max(150),
  requesterContact: z.string().min(5, "Informe um telefone ou e-mail válido.").max(160),
  requestType: z.enum(["ACCESS", "CORRECTION", "DELETION", "PORTABILITY", "CONSENT_REVOCATION"]),
  description: z.string().max(1000).optional().or(z.literal("")),
});

type RequestValues = z.infer<typeof requestSchema>;

export function DataSubjectRequestForm({ tenantSlug }: { tenantSlug: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requesterName: "",
      requesterContact: "",
      requestType: "ACCESS",
      description: "",
    },
  });

  async function onSubmit(values: RequestValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createDataSubjectRequest(tenantSlug, {
        requesterName: values.requesterName,
        requesterContact: values.requesterContact,
        requestType: values.requestType,
        description: values.description || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      setSubmitted(true);
      toast.success("Solicitação registrada.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-2 py-6 text-center">
        <p className="text-lg font-medium">Solicitação registrada!</p>
        <p className="text-muted-foreground text-sm">
          O estabelecimento vai entrar em contato pelo canal informado para tratar sua solicitação.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="requesterName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requesterContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone ou e-mail para retorno</FormLabel>
              <FormControl>
                <Input placeholder="(11) 99999-0000 ou voce@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requestType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que você precisa</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detalhes (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Conte mais sobre sua solicitação" {...field} />
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
          {isSubmitting ? "Enviando..." : "Enviar solicitação"}
        </Button>
      </form>
    </Form>
  );
}
