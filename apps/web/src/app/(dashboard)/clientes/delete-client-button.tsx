"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import type { Client, ClientDeleteImpact } from "@/lib/api-types";
import { getClientDeleteImpact, deleteClient } from "./actions";

/**
 * Excluir cliente sempre reavalia o histórico vinculado no servidor antes de
 * decidir excluir de verdade ou só desativar (nunca confia no que já foi
 * mostrado na tela) - aqui só buscamos o impacto pra dar contexto e
 * recomendação pro admin antes de confirmar. Onda12.
 */
export function DeleteClientButton({ client }: { client: Client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<ClientDeleteImpact | null>(null);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setImpact(null);
      return;
    }
    setLoading(true);
    const result = await getClientDeleteImpact(client.id);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.message);
      setOpen(false);
      return;
    }
    setImpact(result.data);
  }

  async function handleConfirm() {
    const result = await deleteClient(client.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(
      result.data.mode === "DELETED"
        ? "Cliente excluído definitivamente."
        : "Cliente desativado - tinha histórico vinculado, dado preservado.",
    );
    router.refresh();
  }

  const c = impact?.counts;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Excluir">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {client.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-foreground space-y-2 text-left text-sm">
              {loading && <p className="text-muted-foreground">Verificando histórico vinculado...</p>}
              {!loading &&
                c &&
                (impact!.canHardDelete ? (
                  <p>
                    Este cliente não tem agendamento, atendimento, venda ou mensagem de WhatsApp
                    vinculado — será excluído definitivamente, sem deixar rastro.
                  </p>
                ) : (
                  <>
                    <p>
                      Este cliente tem histórico vinculado: {c.appointments} agendamento(s),{" "}
                      {c.attendances} atendimento(s), {c.sales} venda(s), {c.payments} pagamento(s),{" "}
                      {c.commissions} comissão(ões), {c.fiscalDocuments} documento(s) fiscal(is)
                      {c.whatsAppMessages > 0 ? `, ${c.whatsAppMessages} mensagem(ns) de WhatsApp` : ""}.
                    </p>
                    <p className="font-medium">
                      Recomendação: para não comprometer a integridade desses registros (principalmente
                      comissão e faturamento já fechados), o cliente será apenas desativado, não excluído.
                      O cadastro fica marcado como excluído, com data/hora/responsável registrados, e some
                      dos seletores de novo agendamento, venda e atendimento — mas o histórico continua
                      íntegro. Dá para reativar depois em Editar → Status.
                    </p>
                  </>
                ))}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
