import { Scissors, Sparkle } from "lucide-react";

/**
 * Identidade visual de fundo da area operacional (tenant) - marca d'agua bem
 * sutil, nao fotografia de banco de imagens (risco de licenca + clicheria,
 * pesquisa de mercado 2026 recomenda restricao em vez de imagem literal de
 * salao/spa). Reaproveita icones do lucide-react ja usados no projeto em vez
 * de SVG desenhado a mao, pra manter qualidade/consistencia visual.
 * Posicionado uma unica vez no layout compartilhado (nao por tela). Usa
 * position:fixed (nao absolute) porque a area de conteudo cresce com a
 * pagina e pode ficar mais alta que a tela - com absolute, um elemento
 * ancorado no canto inferior ficaria centenas de pixels abaixo da area
 * visivel em telas com scroll. fixed mantem sempre ancorado ao viewport,
 * visivel independente do scroll. Fora do fluxo (pointer-events-none,
 * aria-hidden) - nunca compete com dado real nem com foco de teclado/leitor
 * de tela.
 *
 * z-0 (nao -z-10): um ancestral no shell da pagina cria seu proprio
 * contexto de empilhamento, e um z-index negativo aqui ficava escondido
 * atras dele por completo (testado e confirmado visualmente). Em z-0 o
 * elemento fica atras do conteudo normal da pagina (cards/tabelas, que tem
 * fundo opaco) mas visivel nos espacos vazios, como pretendido.
 */
export function MixWatermark() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <Scissors
        className="absolute -right-16 -bottom-16 h-[420px] w-[420px] -rotate-12"
        style={{ color: "var(--mix-gold)", opacity: 0.05 }}
        strokeWidth={0.6}
      />
      <Sparkle
        className="absolute top-24 -right-6 h-24 w-24 rotate-12"
        style={{ color: "var(--mix-gold-bright)", opacity: 0.08 }}
        strokeWidth={0.8}
      />
    </div>
  );
}
