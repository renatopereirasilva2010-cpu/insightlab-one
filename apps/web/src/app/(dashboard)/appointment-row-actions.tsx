"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Appointment } from "@/lib/api-types";
import { cancelAppointment, markAppointmentNoShow } from "./actions";

const TERMINAL_STATUSES = ["CANCELED", "NO_SHOW", "COMPLETED"];

export function AppointmentRowActions({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [pending, setPending] = useState<"cancel" | "no-show" | null>(null);

  if (TERMINAL_STATUSES.includes(appointment.status)) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  async function handleCancel() {
    setPending("cancel");
    const result = await cancelAppointment(appointment.id);
    setPending(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Agendamento cancelado.");
    router.refresh();
  }

  async function handleNoShow() {
    setPending("no-show");
    const result = await markAppointmentNoShow(appointment.id);
    setPending(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Marcado como não compareceu.");
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending !== null}
        onClick={handleNoShow}
        title="Não compareceu"
      >
        <UserX />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending !== null}
        onClick={handleCancel}
        title="Cancelar"
      >
        <X />
      </Button>
    </div>
  );
}
