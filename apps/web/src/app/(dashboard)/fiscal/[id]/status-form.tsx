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
import { fiscalDocumentStatusLabels } from "@/components/status-badge";
import { updateFiscalDocumentStatus } from "../actions";

const schema = z.object({
  status: z.enum(["REQUESTED", "AUTHORIZED", "FAILED", "CANCELED"]),
  message: z.string().max(255).optional().or(z.literal("")),
  referenceNumber: z.string().max(100).optional().or(z.literal("")),
  accessKey: z.string().max(120).optional().or(z.literal("")),
  errorCode: z.string().max(60).optional().or(z.literal("")),
  errorMessage: z.string().max(500).optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

const NEXT_STATUSES: Record<string, Array<Values["status"]>> = {
  DRAFT: ["REQUESTED"],
  REQUESTED: ["AUTHORIZED", "FAILED"],
  AUTHORIZED: ["CANCELED"],
  CANCELED: [],
  FAILED: [],
};

export function FiscalStatusForm({
  documentId,
  currentStatus,
  onSuccess,
}: {
  documentId: string;
  currentStatus: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowed = NEXT_STATUSES[currentStatus] ?? [];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: allowed[0] ?? "REQUESTED",
      message: "",
      referenceNumber: "",
      accessKey: "",
      errorCode: "",
      errorMessage: "",
    },
  });

  const status = form.watch("status");

  if (allowed.length === 0) {
    return <p className="text-muted-foreground text-sm">Documento em estado final, sem transições possíveis.</p>;
  }

  async function onSubmit(values: Values) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await updateFiscalDocumentStatus(documentId, {
        status: values.status,
        message: values.message || undefined,
        referenceNumber: values.referenceNumber || undefined,
        accessKey: values.accessKey || undefined,
        errorCode: values.errorCode || undefined,
        errorMessage: values.errorMessage || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Status atualizado.");
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Novo status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allowed.map((s) => (
                    <SelectItem key={s} value={s}>
                      {fiscalDocumentStatusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {status === "AUTHORIZED" && (
          <>
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da nota</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave de acesso</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {status === "FAILED" && (
          <>
            <FormField
              control={form.control}
              name="errorCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do erro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="errorMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem de erro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem / observação</FormLabel>
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
          {isSubmitting ? "Salvando..." : "Atualizar status"}
        </Button>
      </form>
    </Form>
  );
}
