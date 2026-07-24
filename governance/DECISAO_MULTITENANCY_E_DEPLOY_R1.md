# DECISÃO DE ARQUITETURA — PADRÃO DE MULTI-TENANCY E ALVO DE DEPLOY

## 1. Contexto

Pendência registrada na seção 10 do adendo `insightlab-one-onda0-adendo-governanca.md`: duas decisões de arquitetura nunca haviam sido travadas formalmente, apesar do código já pressupor multi-tenancy (`tenantId` presente na maioria dos models). Confirmadas por Renato em 24/07/2026.

## 2. Decisão 1 — Padrão de multi-tenancy

**Shared schema + `tenant_id` + Row-Level Security (RLS) do PostgreSQL.**

Estado atual verificado no código: `tenantId` já indexado e usado em filtros explícitos (`WHERE tenantId = ...`) em todos os services revisados (ex.: `PaymentsService`). **RLS ainda não está ativado no Postgres** — o isolamento hoje depende inteiramente do código da aplicação nunca esquecer o filtro por tenant. Isso é aceitável com 1 tenant piloto (Mix Concept Hair), mas é a lacuna real a fechar antes de um segundo tenant entrar.

Schema-per-tenant ou DB-per-tenant só entram em pauta se surgir exigência de isolamento/compliance específica de um cliente.

## 3. Decisão 2 — Alvo de deploy de produção

**Docker Compose continua servindo o dev.** Para produção: plataforma de container gerenciada simples (Cloud Run, Fargate, Railway, Render ou Fly.io) — não Kubernetes. Com 1 tenant piloto, orquestração completa adiciona complexidade operacional sem benefício correspondente.

A escolha entre as opções candidatas (Cloud Run vs. Fargate vs. Railway vs. Render vs. Fly.io) fica para quando o piloto estiver próximo do go-live — depende de fatores ainda não avaliados (custo, familiaridade da equipe, integração com o resto do stack de infra).

## 4. O que esta decisão NÃO faz agora

- Não ativa RLS no Postgres (é o próximo passo técnico, não feito nesta decisão).
- Não escolhe a plataforma de deploy específica entre as candidatas.
- Não altera nenhum código ou schema.

## 5. Encaminhamento futuro

- Desenhar políticas de RLS por tabela multi-tenant antes de um segundo tenant entrar em produção.
- Escolher a plataforma de deploy específica numa rodada dedicada, próxima ao go-live do piloto, com critérios explícitos (custo, operação, integração).

## 6. Classificação final

CONFIRMADO — decisão de arquitetura travada, sem reabertura de escopo de stack (NestJS/Prisma/PostgreSQL/Jest/REST mantidos, ver seção 10 do adendo).
