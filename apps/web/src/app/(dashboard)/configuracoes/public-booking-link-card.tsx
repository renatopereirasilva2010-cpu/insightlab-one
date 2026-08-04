"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * A pagina de agendamento publico (/agendar/[tenantSlug]) sempre existiu e
 * funciona, mas nunca foi exposta em lugar nenhum do painel - ninguem tinha
 * como descobrir o proprio link pra compartilhar com cliente. Onda13.
 */
export function PublicBookingLinkCard({ tenantSlug }: { tenantSlug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/agendar/${tenantSlug}` : `/agendar/${tenantSlug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Link de agendamento público</CardTitle>
        <CardDescription>
          Compartilhe este link com seus clientes para que eles agendem um horário sozinhos, sem
          precisar acessar o painel.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs sm:text-sm" />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink />
              Abrir
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
