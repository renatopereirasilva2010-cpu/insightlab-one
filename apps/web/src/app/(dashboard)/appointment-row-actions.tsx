"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={pending !== null} title="Não compareceu">
            <UserX />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como não compareceu?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marca o agendamento como não compareceu e não pode ser desfeita pela tela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleNoShow}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={pending !== null} title="Cancelar">
            <X />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação cancela o agendamento e não pode ser desfeita pela tela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
