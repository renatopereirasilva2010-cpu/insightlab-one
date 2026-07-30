# DECISÃO DE RISCO ACEITO — `@nestjs/core` (CVE-2026-35515, SSE injection)

## 1. Contexto

Auditoria de dependências (`pnpm audit --prod`, 29/07/2026, dentro da correção geral de vulnerabilidades desta sessão) encontrou 1 vulnerabilidade moderada (CVSS 6.3) em `@nestjs/core@10.4.22`:

`GHSA-36xv-jgw5-4q75` — `SseStream._transform()` não sanitiza `\r`/`\n` em `message.type`/`message.id` antes de escrever no protocolo Server-Sent Events, permitindo forjar eventos SSE ou injetar payload se o client renderizar o dado como HTML sem sanitização.

Versão corrigida: `>=11.1.18` — ou seja, **só existe na major 11 do NestJS**, não há backport pra série 10.x.

## 2. Por que não bloqueia o MVP/R1

A vulnerabilidade está inteiramente dentro de `SseStream`, a implementação de Server-Sent Events do NestJS (decorator `@Sse()`). Busca no código (`grep -rn "@Sse\|SseStream" services/api/src/`) confirma **zero uso de SSE em todo o backend** — nenhuma rota usa `@Sse()`, nenhum lugar constrói um `SseStream`. Um caminho de código nunca invocado não é explorável, independente da versão instalada.

## 3. Por que não force a versão via override agora

Diferente das outras 6 correções desta rodada (que eram overrides de dependências-folha, sem tocar a API pública dos pacotes que as consomem), corrigir esta exigiria subir `@nestjs/core` da major 10 pra 11 — e o ecossistema NestJS é distribuído em pacotes irmãos (`@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/throttler` etc.) que precisam estar todos na mesma major pra funcionar juntos. Forçar só `@nestjs/core` via `pnpm.overrides` deixaria o app com `core@11.x` e todo o resto em `10.x` — combinação não suportada pelo próprio framework, com risco real de quebrar injeção de dependência, guards, decorators ou o ciclo de vida de módulos em produção. Isso não é um ajuste pontual, é uma migração de framework completa (múltiplos pacotes, possíveis breaking changes na API pública, precisa de teste dedicado ponta a ponta) — desproporcional a corrigir uma vulnerabilidade num recurso que o projeto nunca usa.

## 4. Decisão

Aceitar o risco. Não forçar upgrade de `@nestjs/core` (nem via override nem via bump direto dos pacotes `@nestjs/*`) nesta rodada.

## 5. O que não será feito agora
- Override de `@nestjs/core` via `pnpm.overrides`.
- Upgrade dos pacotes `@nestjs/*` pra major 11 fora de uma rodada dedicada de migração.
- Qualquer implementação de SSE enquanto esta decisão estiver em vigor sem reavaliar a versão primeiro.

## 6. Encaminhamento futuro
Se o projeto vier a precisar de Server-Sent Events (ex.: a atualização "em tempo real" do Painel/Inteligência de Receita evoluir de revalidação por Server Action pra push de verdade), essa é a hora natural de avaliar a migração completa pra NestJS 11 como rodada própria — com teste de regressão completo, não como correção reativa de auditoria.

## 7. Classificação final
RISCO ACEITO — vulnerabilidade em código não utilizado (`SseStream`), correção real exige migração de framework major (10→11), fora de escopo proporcional desta rodada de segurança. Reavaliar se o projeto passar a usar SSE ou numa migração de major do NestJS já planejada por outro motivo.

*Demais achados desta auditoria (`fast-uri`, `js-yaml`, `sharp`, `postcss`, `body-parser`, `qs`, `file-type`) corrigidos via `pnpm.overrides` no `package.json` raiz, validados com `tsc --noEmit`, `pnpm build` (backend + frontend) e suíte Jest completa (34 suítes / 246 testes) — zero regressão. Restam apenas 2 achados de baixa severidade em ferramentas de desenvolvimento que nunca rodam em produção (`@hono/node-server` e `@babel/core`, ambos transitivos do CLI `shadcn`, usado só localmente por quem desenvolve o front-end).*
