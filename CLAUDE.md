# InsightLab One — Instruções para Claude Code

@governance/insightlab-one-onda0-adendo-governanca.md

*(Se o import acima não carregar sozinho, peça explicitamente na primeira mensagem: "leia governance/insightlab-one-onda0-adendo-governanca.md antes de qualquer coisa".)*

## Contexto rápido
SaaS multi-tenant de agenda/gestão para salões de beleza e clínicas de estética. Caso-base: Mix Concept Hair. Stack: NestJS + Prisma + PostgreSQL 16, em Docker dentro de WSL2/Ubuntu 24.04. O arquivo importado acima é a fonte de verdade do plano atual (corte de MVP, estratégia de stack, higiene de bancos, versionamento). Isto aqui é o contrato de comportamento — a execução do plano, não o plano em si.

## Regras fixas (não negociáveis)
- Ambiente: sempre WSL2/Ubuntu. Nunca PowerShell nem Desktop do Windows pra rodar ou guardar o projeto.
- Toda mudança relevante segue: diagnóstico → risco → impacto → plano → validação → rollback, nessa ordem.
- Nunca inventar output de terminal ou comando executado. Se faltar evidência, diga exatamente o que precisa ser coletado e pare.
- Propostas técnicas maiores usam o formato ONDA | FASE | ETAPA (Objetivo / O que será feito / O que não será feito / Riscos / TERMINAL 1-2-3 / Critério de sucesso).
- Nunca reabrir escopo ou decisão de arquitetura já congelada sem evidência objetiva nova.
- Nunca rodar ou sugerir `--dangerously-skip-permissions` nesta máquina — ela tem Docker, banco real e código real, não é um sandbox descartável.

## As 3 zonas de autonomia — "quanto você decide sozinho"

🟢 **Verde — aja sem perguntar.** `git status`/`log`/`diff`, `docker ps`, `docker volume ls`, `docker system df`, `prisma migrate status`, leitura de código/docs/schema, `pg_dump` (é leitura, não apaga nada), `pnpm`/`npm audit`, lint, testes. Reporte o achado; não peça permissão pra isso.

🟡 **Amarela — aja sem perguntar, mas só dentro de uma branch.** Escrever código e teste, rascunhar migration sem aplicar, refatorar. Decida a implementação por conta própria; não precisa validar cada linha com Renato.

🔴 **Vermelha — PARE e peça permissão explícita, descrevendo o que vai fazer e por quê, antes de executar. Sempre, mesmo que pareça óbvio ou pequeno:**
- Aplicar migration em banco com dado real (`prisma migrate deploy` / `migrate reset`)
- Remover ou dropar qualquer database, volume ou container Docker
- Merge pra main/develop, ou qualquer `git push`
- SQL direto fora de uma migration
- Mexer em dado de tenant real ou de pagamento
- Deploy pra qualquer ambiente além do dev local

Ao pedir permissão: diga o comando exato, o que ele muda, e o rollback se der errado. Espere um "sim" explícito — silêncio ou ambiguidade não é aprovação. "Autonomia" nunca significa pular a Zona Vermelha.

## Ordem de trabalho ao iniciar a sessão
1. Diagnóstico completo — repositório (git, branch, migrations) e Docker (containers, volumes, bancos lógicos). Reportar tudo antes de propor qualquer ação.
2. Classificar os bancos encontrados JUNTO com Renato — a origem de cada um é julgamento dele, não seu.
3. Depois da classificação confirmada: dump de tudo (Zona Amarela) → proposta ONDA|FASE|ETAPA formal pra remoção do que for redundante (Zona Vermelha, aprovação item a item).
4. Confirmar com Renato o corte de MVP e as duas decisões de stack pendentes (padrão de multi-tenancy, alvo de deploy de produção) antes de reabrir qualquer bloco de código.
5. Só então propor a retomada do Bloco 27 (transições REQUESTED→FAILED e AUTHORIZED→CANCELED, campos errorCode/errorMessage/canceledAt, eventos ERROR/CANCELED), numa branch dedicada, formato ONDA|FASE|ETAPA.

## Uma coisa a evitar
Não "ajude" corrigindo algo fora do escopo do passo atual, por mais óbvio que pareça. Reporte e pergunte antes de expandir escopo.

## InsightLab Brand and Product Experience

Importado em 28/07/2026 a pedido de Renato. Fonte completa: `docs/brand/INSIGHTLAB_BRAND_SYSTEM.md`, `design-tokens/insightlab.tokens.{css,json}`, `apps/web/public/brand/insightlab-logo-original.png`. As regras fixas e zonas de autonomia acima continuam valendo por cima disto — marca não é exceção a governança técnica.

Before changing UI, UX, visual styles, dashboards, charts, predictive features, CRM screens, campaigns, login, navigation, customer views, or product copy, read `docs/brand/INSIGHTLAB_BRAND_SYSTEM.md` and the token files above.

### Brand hierarchy
- Umbrella brand: **InsightLab**
- Base product: **InsightLab One**
- Intelligence capability: **InsightLab Intelligence**
- Strategic descriptor: **Revenue Recovery Intelligence**
- Verticals: **Beauty**, **Dental**, and future governed verticals
- Write `InsightLab` without a space, capital `I` and `L`.
- A tenant may be presented as `InsightLab One • <Tenant name>` — **pendente de decisão de Renato quanto ao grau de white-label na área operacional do tenant** (ver conversa de 28/07/2026 — o doc de marca recomenda identidade do tenant subordinada; Renato descreveu algo mais próximo de branding do tenant dominante na área operacional. Não resolver essa tensão sem confirmação explícita).

### Non-negotiable experience principles
Every relevant analytical experience should answer: o que está acontecendo, por que importa, qual oportunidade/risco, qual ação recomendada, qual impacto estimado, qual confiança, como acompanhar o resultado. Nunca comunicar previsão como garantia.

### Visual identity
Core colors: Navy `#0C235A`, Indigo `#444FB1`, Violet `#5C31D6`, Blue `#2FA1DD`, Cyan `#40BCDF`, Mist `#EBF0F9`. Proporção: 70-80% branco/off-white, 15-20% navy estrutural, 5-10% acentos. Logo é artwork — nunca redigitar o wordmark, nunca improvisar SVG/transparente/mono/favicon sem registrar a lacuna.

### Implementation workflow (obrigatório antes de qualquer mudança visual)
1. Inspecionar framework, tema atual, componentes, rotas, assets.
2. Mapear cores/componentes existentes → tokens InsightLab.
3. Preservar comportamento e regra de negócio.
4. Propor sequência de implementação antes de mudança visual ampla.
5. Implementar shell/componentes compartilhados antes de tela por tela.
6. Validar responsividade, acessibilidade, testes, lint, build.
7. Reportar lacunas de asset ou acessibilidade explicitamente.

Não: substituir o design system cegamente, redesenhar fluxo de negócio sem autorização, gerar variante de logo silenciosamente, afirmar verificação visual sem ter renderizado de fato.
