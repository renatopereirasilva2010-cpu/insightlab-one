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
