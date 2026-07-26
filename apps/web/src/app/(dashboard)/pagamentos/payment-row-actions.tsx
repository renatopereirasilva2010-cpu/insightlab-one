"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EntityDialog } from "@/components/entity-dialog";
import type { Payment } from "@/lib/api-types";
import { markPaymentPaid, cancelPayment } from "./actions";
import { MarkFailedForm } from "./mark-failed-form";

const TERMINAL = ["PAID", "CANCELED", "FAILED"];

export function PaymentRowActions({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failedOpen, setFailedOpen] = useState(false);

  if (TERMINAL.includes(payment.status)) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  async function handleMarkPaid() {
    setPending(true);
    const result = await markPaymentPaid(payment.id);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Pagamento confirmado.");
    router.refresh();
  }

  async function handleCancel() {
    setPending(true);
    const result = await cancelPayment(payment.id);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Pagamento cancelado.");
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" disabled={pending} onClick={handleMarkPaid} title="Confirmar pagamento">
        <Check />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setFailedOpen(true)}
        title="Marcar como falho"
      >
        <AlertTriangle />
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={handleCancel} title="Cancelar">
        <Ban />
      </Button>

      <EntityDialog title="Marcar pagamento como falho" open={failedOpen} onOpenChange={setFailedOpen}>
        {({ close }) => <MarkFailedForm paymentId={payment.id} onSuccess={close} />}
      </EntityDialog>
    </div>
  );
}
