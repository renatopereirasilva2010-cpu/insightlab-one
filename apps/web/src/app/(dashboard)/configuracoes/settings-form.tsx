"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { BusinessSettings } from "@/lib/api-types";
import { updateBusinessSettings } from "./actions";

const RELEASE_MODE_LABELS: Record<string, string> = {
  ON_PAYMENT: "Ao pagamento",
  MANUAL: "Manual",
  IMMEDIATE: "Imediato",
};

const settingsSchema = z.object({
  timezone: z.string().min(1).max(50),
  currency: z.string().min(1).max(3),
  cancelPolicyHours: z.coerce.number().min(0).max(720),
  lateToleranceMinutes: z.coerce.number().min(0).max(180),
  deferredPaymentLabel: z.string().min(1).max(100),
  allowDeferredPayment: z.boolean(),
  commissionReleaseMode: z.enum(["ON_PAYMENT", "MANUAL", "IMMEDIATE"]),
  allowCommissionManualRelease: z.boolean(),
  commissionReleaseAllowDeferred: z.boolean(),
});

type SettingsInput = z.input<typeof settingsSchema>;
type SettingsValues = z.output<typeof settingsSchema>;

export function SettingsForm({
  settings,
  onSuccess,
}: {
  settings: BusinessSettings;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsInput, unknown, SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      timezone: settings.timezone,
      currency: settings.currency,
      cancelPolicyHours: settings.cancelPolicyHours,
      lateToleranceMinutes: settings.lateToleranceMinutes,
      deferredPaymentLabel: settings.deferredPaymentLabel,
      allowDeferredPayment: settings.allowDeferredPayment,
      commissionReleaseMode: settings.commissionReleaseMode,
      allowCommissionManualRelease: settings.allowCommissionManualRelease,
      commissionReleaseAllowDeferred: settings.commissionReleaseAllowDeferred,
    },
  });

  async function onSubmit(values: SettingsValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await updateBusinessSettings(values);

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      toast.success("Configurações atualizadas.");
      router.refresh();
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuso horário</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moeda</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cancelPolicyHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo de cancelamento (horas)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={720}
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lateToleranceMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tolerância de atraso (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    {...field}
                    value={(field.value as number | string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="deferredPaymentLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rótulo do pagamento a prazo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowDeferredPayment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Permitir pagamento a prazo</FormLabel>
            </FormItem>
          )}
        />

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Comissão</p>

          <FormField
            control={form.control}
            name="commissionReleaseMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modo de liberação</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(RELEASE_MODE_LABELS).map(([value, label]) => (
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
            name="allowCommissionManualRelease"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Permitir liberação manual</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commissionReleaseAllowDeferred"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">
                  Liberar comissão mesmo com pagamento a prazo (antes da quitação)
                </FormLabel>
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
          {isSubmitting ? "Salvando..." : "Salvar configurações"}
        </Button>
      </form>
    </Form>
  );
}
