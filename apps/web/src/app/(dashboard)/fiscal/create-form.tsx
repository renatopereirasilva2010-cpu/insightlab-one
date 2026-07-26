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
import { formatCurrency } from "@/lib/format";
import type { Sale, Payment, Client } from "@/lib/api-types";
import { createFiscalDocument } from "./actions";

const schema = z.object({
  sourceType: z.enum(["SALE", "PAYMENT", "MANUAL"]),
  sourceId: z.string().min(1, "Selecione a origem."),
  documentType: z.enum(["NFSE", "NFE", "NFCE", "OTHER"]),
  provider: z.string().max(50).optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

export function CreateFiscalDocumentForm({
  sales,
  payments,
  clients,
  onSuccess,
}: {
  sales: Sale[];
  payments: Payment[];
  clients: Client[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { sourceType: "SALE", sourceId: "", documentType: "NFSE", provider: "" },
  });

  const sourceType = form.watch("sourceType");

  async function onSubmit(values: Values) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await createFiscalDocument({
        sourceType: values.sourceType,
        sourceId: values.sourceId,
        documentType: values.documentType,
        provider: values.provider || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Documento fiscal criado.");
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
          name="sourceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origem</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("sourceId", "");
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SALE">Venda</SelectItem>
                  <SelectItem value="PAYMENT">Pagamento</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {sourceType === "SALE" && (
          <FormField
            control={form.control}
            name="sourceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venda</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a venda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {(s.clientId && clientById.get(s.clientId)?.name) || "Sem cliente"} -{" "}
                        {formatCurrency(s.totalAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {sourceType === "PAYMENT" && (
          <FormField
            control={form.control}
            name="sourceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagamento</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {payments.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {formatCurrency(p.amount)} · {p.method} ({p.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {sourceType === "MANUAL" && (
          <FormField
            control={form.control}
            name="sourceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referência da origem</FormLabel>
                <FormControl>
                  <Input placeholder="Identificador livre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="documentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de documento</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NFSE">NFS-e</SelectItem>
                  <SelectItem value="NFE">NF-e</SelectItem>
                  <SelectItem value="NFCE">NFC-e</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provedor</FormLabel>
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
          {isSubmitting ? "Salvando..." : "Criar documento"}
        </Button>
      </form>
    </Form>
  );
}
