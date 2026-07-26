"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Attendance } from "@/lib/api-types";
import { startAttendance, finishAttendance, cancelAttendance } from "./actions";

export function AttendanceRowActions({ attendance }: { attendance: Attendance }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<{ ok: boolean; message?: string }>, successMsg: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      toast.error(result.message ?? "Erro ao atualizar atendimento.");
      return;
    }
    toast.success(successMsg);
    router.refresh();
  }

  if (attendance.status === "OPEN") {
    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(() => startAttendance(attendance.id), "Atendimento iniciado.")}
          title="Iniciar"
        >
          <Play />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(() => cancelAttendance(attendance.id), "Atendimento cancelado.")}
          title="Cancelar"
        >
          <X />
        </Button>
      </div>
    );
  }

  if (attendance.status === "IN_PROGRESS") {
    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(() => finishAttendance(attendance.id), "Atendimento finalizado.")}
          title="Finalizar"
        >
          <Check />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(() => cancelAttendance(attendance.id), "Atendimento cancelado.")}
          title="Cancelar"
        >
          <X />
        </Button>
      </div>
    );
  }

  return <span className="text-muted-foreground text-xs">—</span>;
}
