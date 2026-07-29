"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WhatsAppMessage } from "@/lib/api-types";
import { resendWhatsAppMessage } from "./actions";

export function MessageRowActions({ message }: { message: WhatsAppMessage }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (message.status === "SENT") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  async function handleResend() {
    setPending(true);
    const result = await resendWhatsAppMessage(message.id);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Reenvio solicitado.");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={handleResend} title="Reenviar">
      <RotateCw />
    </Button>
  );
}
