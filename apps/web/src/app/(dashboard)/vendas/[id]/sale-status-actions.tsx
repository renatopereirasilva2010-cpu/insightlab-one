"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, Ban } from "lucide-react";
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
import type { Sale } from "@/lib/api-types";
import { recalculateSale, readyForCheckout, cancelSale } from "../actions";

export function SaleStatusActions({
  sale,
  canUpdate,
  canCheckout,
  canCancel,
}: {
  sale: Sale;
  canUpdate: boolean;
  canCheckout: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function run(
    key: string,
    action: () => Promise<{ ok: boolean; message?: string }>,
    successMsg: string,
  ) {
    setPending(key);
    const result = await action();
    setPending(null);
    if (!result.ok) {
      toast.error(result.message ?? "Erro ao atualizar venda.");
      return;
    }
    toast.success(successMsg);
    router.refresh();
  }

  const isTerminal = sale.status === "COMPLETED" || sale.status === "CANCELED";

  return (
    <div className="flex gap-2">
      {canUpdate && !isTerminal && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() => run("recalc", () => recalculateSale(sale.id), "Totais recalculados.")}
        >
          <RefreshCw />
          Recalcular
        </Button>
      )}

      {canCheckout && sale.status === "OPEN" && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== null || sale.items.length === 0}
          onClick={() =>
            run("checkout", () => readyForCheckout(sale.id), "Venda pronta para checkout.")
          }
        >
          <CheckCircle2 />
          Pronta p/ checkout
        </Button>
      )}

      {canCancel && !isTerminal && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={pending !== null}>
              <Ban />
              Cancelar venda
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar esta venda?</AlertDialogTitle>
              <AlertDialogDescription>
                Itens, pagamentos e comissões vinculados a esta venda deixam de valer. Essa ação não
                pode ser desfeita pela tela — só criando uma venda nova.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => run("cancel", () => cancelSale(sale.id), "Venda cancelada.")}
              >
                Cancelar venda
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
