"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Ban } from "lucide-react";
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
import type { Commission } from "@/lib/api-types";
import { releaseCommission, blockCommission, cancelCommission } from "./actions";

export function CommissionRowActions({ commission }: { commission: Commission }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<{ ok: boolean; message?: string }>, msg: string) {
    setPending(key);
    const result = await action();
    setPending(null);
    if (!result.ok) {
      toast.error(result.message ?? "Erro ao atualizar comissão.");
      return;
    }
    toast.success(msg);
    router.refresh();
  }

  if (commission.status === "CANCELED") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex justify-end gap-1">
      {commission.status !== "RELEASED" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending !== null}
          onClick={() => run("release", () => releaseCommission(commission.id), "Comissão liberada.")}
          title="Liberar"
        >
          <CheckCircle2 />
        </Button>
      )}
      {commission.status === "PENDING" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending !== null}
          onClick={() => run("block", () => blockCommission(commission.id), "Comissão bloqueada.")}
          title="Bloquear"
        >
          <Lock />
        </Button>
      )}
      {commission.status !== "RELEASED" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={pending !== null} title="Cancelar">
              <Ban />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar esta comissão?</AlertDialogTitle>
              <AlertDialogDescription>
                O profissional deixa de ter direito a este valor. Comissões já liberadas não podem
                ser canceladas por aqui.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => run("cancel", () => cancelCommission(commission.id), "Comissão cancelada.")}
              >
                Cancelar comissão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
