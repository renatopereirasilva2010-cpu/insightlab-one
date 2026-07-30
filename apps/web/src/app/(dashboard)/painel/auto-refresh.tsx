"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * "Tempo real" pragmatico: sem WebSocket/SSE (infra nova, desproporcional
 * ao ganho aqui - ver plano da rodada). Toda mutacao relevante ja chama
 * revalidatePath("/painel") nas Server Actions; isto so garante que, se a
 * aba ficar aberta enquanto outra pessoa fecha uma venda, o indicador
 * atualiza sozinho ao voltar o foco pra aba, sem precisar de F5 manual.
 */
export function AutoRefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    function handleFocus() {
      router.refresh();
    }
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
