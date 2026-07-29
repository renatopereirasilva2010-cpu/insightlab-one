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
import type { DataSubjectRequest } from "@/lib/api-types";
import { updateDataSubjectRequest } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvida",
  REJECTED: "Rejeitada",
};

const resolveSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"]),
  resolutionNotes: z.string().max(1000).optional().or(z.literal("")),
});

type ResolveValues = z.infer<typeof resolveSchema>;

export function ResolveRequestForm({
  request,
  onSuccess,
}: {
  request: DataSubjectRequest;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResolveValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: { status: request.status, resolutionNotes: request.resolutionNotes ?? "" },
  });

  async function onSubmit(values: ResolveValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await updateDataSubjectRequest(request.id, {
        status: values.status,
        resolutionNotes: values.resolutionNotes || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Solicitação atualizada.");
      router.refresh();
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-md border p-3 text-sm">
          <p>
            <span className="font-medium">{request.requesterName}</span> ·{" "}
            {request.requesterContact}
          </p>
          {request.description && (
            <p className="text-muted-foreground mt-1">{request.description}</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
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
          name="resolutionNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas de resolução</FormLabel>
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
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
