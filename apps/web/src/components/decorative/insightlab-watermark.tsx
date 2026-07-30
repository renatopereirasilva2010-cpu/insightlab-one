import { Network } from "lucide-react";

/**
 * Identidade visual de fundo da area de modulos (InsightLab) - motivo de
 * grafo/rede de dados, ecoando "inteligencia de dados" sem competir com a
 * legibilidade da navegacao (opacidade bem baixa, confinado as zonas vazias
 * do cabecalho/rodape da sidebar, nunca atras de texto). Mesma logica do
 * MixWatermark: icone do lucide-react ja usado no projeto, nao SVG novo.
 * z-0, nao -z-10 - mesmo motivo documentado em mix-watermark.tsx (z-index
 * negativo some atras de um ancestral com contexto de empilhamento proprio).
 */
export function InsightLabWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <Network
        className="absolute -top-10 -right-14 h-56 w-56 rotate-6"
        style={{ color: "var(--insightlab-mist-100)", opacity: 0.06 }}
        strokeWidth={0.6}
      />
      <Network
        className="absolute -bottom-16 -left-12 h-64 w-64 -rotate-12"
        style={{ color: "var(--insightlab-mist-100)", opacity: 0.05 }}
        strokeWidth={0.6}
      />
    </div>
  );
}
