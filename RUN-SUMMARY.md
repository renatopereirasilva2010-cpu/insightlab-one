# RUN-SUMMARY.md — InsightLab One

## 1. Origem e função deste arquivo
Este arquivo nasce diretamente do Documento-Mestre do projeto.
Ele existe para uso exclusivo do Codex e da operação assistida, registrando apenas a trilha mínima relevante da execução.

## 2. Execução
- Data: 2026-04-05
- Frente: R1.11a — Entrega segura mínima, qualidade pragmática e readiness de go-live controlado
- Objetivo: materializar o handoff local V40 e executar o BLOCO 1.1 com correção mínima da trilha de lint e verificação focal do warning de worker/teardown do Jest

## 3. Contexto usado
- Documento-Mestre revisado?: sim, extrato operacional V40 local
- AGENTS.md revisado?: sim
- Frente ativa considerada?: sim, R1.11a com R1.8.x preservada
- Houve gate multiagente?: sim, em leitura consolidada de produto, operação, arquitetura, qualidade, fiscal, go-live e segurança em nível de diagnóstico e correção mínima

## 4. Arquivos alterados
- AGENTS.md
- RUN-SUMMARY.md
- InsightLab_One_Documento_Mestre_V40.txt
- services/api/package.json
- observação: .codex permanece não rastreado no git status e não foi tocado

## 5. Comandos executados
- pnpm exec eslint -v
- pnpm lint
- pnpm test
- pnpm --filter api test -- --detectOpenHandles
- pnpm --filter api exec tsc --noEmit -p tsconfig.spec.json
- pnpm --filter api lint
- pnpm lint
- pnpm lint (em `services/api`)
- pnpm test (em `services/api`)
- POST `/v1/auth/login`
- GET `/v1/clients` com Bearer token

## 6. Resultado
- handoff V40 materializado localmente na raiz do workspace
- versão efetiva do ESLint confirmada: 9.39.4
- causa real do gap de lint confirmada: ausência de `eslint.config.*` compatível com ESLint 9 e ausência local de `@typescript-eslint`
- trilha de lint restaurada de forma pragmática e mínima com `tsc --noEmit -p tsconfig.spec.json` no pacote `api`
- `pnpm lint` volta a ser executável na raiz e em `services/api`
- `pnpm test` na raiz segue verde
- `pnpm lint` em `services/api`: OK
- `pnpm test` em `services/api`: OK
- `services/api`: `25` suítes / `55` testes verdes
- checagem focal com `--detectOpenHandles` passou sem reproduzir warning de teardown/open handles nesta sessão
- runtime real de `services/api` validado no ambiente atual do WSL
- autenticação mínima validada em HTTP real:
  - `POST /v1/auth/login`: `201 Created`
  - `GET /v1/clients` com Bearer token: `200 OK` com dados reais
- massa mínima funcional do MVP explicitada de forma objetiva e enxuta
- readiness mínimo da R1.11a fechado em verde para piloto/go-live controlado no corte aprovado
- corte operacional de piloto/go-live controlado registrado com trilha repetível e rollback mínimo preservados
- o que foi adiado:
  - restauração de um lint semântico completo com regras ESLint para TypeScript
  - ampliação de hardening além do corte mínimo desta frente

## 7. Evidências
- lint:
  - `pnpm exec eslint -v`: OK (v9.39.4)
  - `pnpm lint` antes da correção: FALHA por ausência de `eslint.config.(js|mjs|cjs)`
  - `pnpm --filter api exec tsc --noEmit -p tsconfig.spec.json`: OK
  - `pnpm --filter api lint` após correção: OK
  - `pnpm lint` na raiz após correção: OK
  - `pnpm lint` em `services/api`: OK
- test:
  - raiz: OK (25 suítes / 55 testes)
  - `pnpm --filter api test -- --detectOpenHandles`: OK (25 suítes / 55 testes)
  - `pnpm test` em `services/api`: OK (25 suítes / 55 testes)
- runtime:
  - validado no ambiente real atual do WSL
- smoke:
  - validado por evidência HTTP mínima autenticada
- readiness:
  - formalizado em verde no corte mínimo aprovado
  - runtime, autenticação mínima e validação autenticada já comprovados

## 8. Leitura consolidada
- o que ganhamos:
  - handoff local permanente e fiel ao recorte operacional da V40
  - restauração imediata da executabilidade de `pnpm lint` na raiz e no serviço real
  - confirmação de que o warning de teardown do Jest não foi reproduzido na checagem focal desta sessão
  - mapa operacional consolidado entre raiz e `services/api`
  - validação do runtime real com fluxo HTTP mínimo completo
  - massa mínima funcional explícita para o MVP
  - corte objetivo de piloto/go-live controlado sem expansão de escopo
- o que arriscamos:
  - tratar a restauração pragmática do lint como equivalente a uma política completa de ESLint para TypeScript
  - adiar demais a volta de regras semânticas quando o piloto exigir hardening maior
- o que foi adiado:
  - lint semântico completo com flat config e regras de TypeScript
  - hardening adicional fora do corte mínimo desta frente
- o que deve ir para R1.1 / R2:
  - enriquecimento de regras de lint não bloqueantes ao go-live
  - refatoração ornamental
  - melhorias operacionais que não alteram o corte do MVP

## 9. Riscos / débitos aceitos
- o lint restaurado nesta sessão é uma verificação estática mínima via TypeScript, não uma malha completa de regras ESLint
- o warning histórico de teardown/open handles do Jest não foi reproduzido agora, mas permanece como observação a monitorar
- o evento `EADDRINUSE` deve ser tratado apenas como ocorrência operacional de segunda instância concorrente na porta `4000`
- docs/fase-status.md e docs/project-phase-status.md não devem prevalecer sobre o Documento-Mestre

## 10. O que ficou pendente
- decidir quando migrar para uma trilha completa de ESLint flat config com suporte explícito a TypeScript
- manter o corte mínimo atual sem inflar a frente ativa
- preparar eventual síntese relevante para retroalimentação do Documento-Mestre

## 11. Próximo passo recomendado
- manter a trilha repetível do corte aprovado:
  - `pnpm lint`
  - `pnpm test`
  - validação HTTP mínima autenticada
- usar este corte para piloto/go-live controlado sem expansão funcional
- mover hardening adicional não bloqueante para R1.1 / R2

## 13. Atualização incremental — runtime, smoke e readiness
- smoke mínimo reproduzível permanece materializado em `services/api/scripts/smoke-runtime-min.sh`
- no ambiente real atual do WSL, o runtime foi validado por evidência HTTP:
  - `POST /v1/auth/login`: `201 Created`
  - `GET /v1/clients` com Bearer token: `200 OK` com dados reais
- `pnpm lint` e `pnpm test` em `services/api` permanecem verdes no ambiente atual:
  - lint: OK
  - test: OK
  - 25 suítes / 55 testes verdes
- o erro anterior de PostgreSQL indisponível deve ser tratado como não reproduzido no ambiente real atual
- o evento `EADDRINUSE` fica registrado apenas como ocorrência operacional de segunda instância concorrente na porta `4000`
- massa mínima funcional, readiness verde, corte operacional de piloto/go-live e rollback mínimo ficam consolidados em `READINESS-R1.11a.md`

## 12. Regra de retroalimentação
Este arquivo não substitui o Documento-Mestre.
A síntese desta execução já foi incorporada ao Documento-Mestre V40 como atualização incremental relevante.

## 14. Atualização incremental — fechamento do BLOCO de disponibilização controlada
- Data: 2026-04-08
- Frente: R1.11a — entrega segura mínima, qualidade pragmática e readiness de go-live controlado
- Objetivo: fechar o BLOCO atual de disponibilização controlada do MVP ao cliente/piloto com evidência HTTP real, massa mínima acessível e fluxo-piloto único executado ponta a ponta

### Evidência operacional objetiva
- listener validado em `:4000` para API e `:5432` para PostgreSQL local
- `services/api/.env` confirma `API_URL=http://localhost:4000` e `DATABASE_URL=postgresql://insightlab:***@localhost:5432/insightlab_one?schema=public`
- `pnpm exec prisma migrate status` em `services/api`: banco `insightlab_one` em `localhost:5432` e schema atualizado
- `pnpm build` em `services/api`: OK
- autenticação real validada:
  - `POST /v1/auth/login`: `201 Created`
  - usuário: `admin@mix-demo.local`
  - tenant: `cmnez9vyp000gbb10g7pwbgjs`
  - unit: `cmnez9vzr000ibb10hg4mrcae`
- leitura autenticada da massa mínima validada com `200 OK`:
  - `GET /v1/clients`: `2`
  - `GET /v1/professionals`: `2`
  - `GET /v1/services-catalog`: `3`
  - `GET /v1/appointments`: `6` antes do fluxo e `7` após o fluxo
  - `GET /v1/attendances`: `2` antes do fluxo e `3` após o fluxo
  - `GET /v1/fiscal-documents`: `11` antes do fluxo e `12` após o fluxo

### Fluxo-piloto único executado
- marcador: `p99443028`
- trilho validado:
  - login
  - leitura de `clients`, `professionals` e `services-catalog`
  - criação de `appointment`: `cmnqtlnod0005v8txnv40sayq`
  - criação de `attendance`: `cmnqtlnqq0007v8tx9heq2ci3`
  - transição `attendance OPEN -> IN_PROGRESS -> FINISHED`
  - criação de `fiscal-document`: `cmnqtlnwf0009v8txm6i40szo`
  - transição fiscal `DRAFT -> REQUESTED -> AUTHORIZED`
- evidência fiscal final:
  - `sourceId`: `att-v8tx9heq2ci3-443028`
  - `referenceNumber`: `NFSE-99443028`
  - `accessKey`: `KEY-99443028`
  - `GET /v1/fiscal-documents/cmnqtlnwf0009v8txm6i40szo`: status `AUTHORIZED`, `3` eventos, último evento `AUTHORIZED`

### Ajustes/correções realizados nesta execução
- nenhuma correção de código foi necessária
- nenhuma migration nova foi criada
- nenhuma seed adicional foi necessária
- a única correção operacional feita durante a execução foi adequar o `sourceId` do fiscal ao contrato real de até `50` caracteres após retorno `400` objetivo da API

### Resultado e corte
- BLOCO fechado com evidência executável e sem ressalva operacional relevante para o corte atual
- pronto para piloto/go-live controlado no escopo mínimo aprovado

## Atualizacao operacional local validada em 2026-04-20
- Runtime local da API validado com `services/api/.env` apontando para `postgresql://insightlab:insightlab123@localhost:5433/insightlab_one?schema=public`
- Banco local validado para retomada: `pg_old_inspect` publicado na porta `5433`
- `services/api/scripts/smoke-runtime-min.sh`: `SMOKE_STATUS=PASS`
- Login em `/v1/auth/login`: OK
- `GET /v1/clients` autenticado: OK

## Atualizacao operacional local validada em 2026-04-27
- Baseline documental vigente local alinhada para `InsightLab_One_Documento_Mestre_V48.txt`
- V48 materializada com sucesso em `docs/llm/InsightLab_One_Documento_Mestre_V48.txt`
- Banco local validado para retomada: `pg_old_inspect` publicado na porta `5433`
- `services/api/.env` validado com `DATABASE_URL=postgresql://insightlab:insightlab123@localhost:5433/insightlab_one?schema=public`
- API validada em runtime real na porta `4000`
- Evidencia objetiva de boot:
  - `Nest application successfully started`
- Smoke minimo HTTP validado:
  - `POST /v1/auth/login` com payload `{}` retornando `400 Bad Request` por validacao de DTO, comportamento esperado do teste
- Leitura consolidada:
  - a retomada local deve partir da baseline V48 ou posterior validada
  - o alvo local correto da API nesta retomada e `pg_old_inspect` na `5433`
  - referencias historicas anteriores a V40 e `5432` permanecem como registro de execucoes passadas e nao substituem a baseline local vigente atual
