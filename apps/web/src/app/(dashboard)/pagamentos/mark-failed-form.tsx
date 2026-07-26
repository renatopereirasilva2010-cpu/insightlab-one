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
import { markPaymentFailed } from "./actions";

const schema = z.object({
  errorCode: z.string().max(50).optional().or(z.literal("")),
  errorMessage: z.string().max(500).optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

export function MarkFailedForm({ paymentId, onSuccess }: { paymentId: string; onSuccess: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { errorCode: "", errorMessage: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await markPaymentFailed(paymentId, {
        errorCode: values.errorCode || undefined,
        errorMessage: values.errorMessage || undefined,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Pagamento marcado como falho.");
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
          name="errorCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código do erro</FormLabel>
              <FormControl>
                <Input placeholder="Opcional" {...field} />
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

        <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Marcar como falho"}
        </Button>
      </form>
    </Form>
  );
}
