"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CommissionPayout } from "@/lib/api-types";
import { markPayoutPaid, markPayoutFailed } from "./actions";

export function PayoutRowActions({ payout }: { payout: CommissionPayout }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  if (payout.status === "PAID" || payout.status === "CANCELED") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  async function run(key: string, action: () => Promise<{ ok: boolean; message?: string }>, msg: string) {
    setPending(key);
    const result = await action();
    setPending(null);
    if (!result.ok) {
      toast.error(result.message ?? "Erro ao atualizar repasse.");
      return;
    }
    toast.success(msg);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending !== null}
        onClick={() => run("paid", () => markPayoutPaid(payout.id), "Repasse marcado como pago.")}
        title="Marcar como pago"
      >
        <CheckCircle2 />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending !== null}
        onClick={() => run("failed", () => markPayoutFailed(payout.id), "Repasse marcado como falho.")}
        title="Marcar como falho"
      >
        <XCircle />
      </Button>
    </div>
  );
}
