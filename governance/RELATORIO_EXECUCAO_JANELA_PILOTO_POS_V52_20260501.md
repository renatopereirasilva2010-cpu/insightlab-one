# RELATORIO DE EXECUCAO DA JANELA DE PILOTO / GO-LIVE CONTROLADO POS-V52

## 1. Identificacao da execucao

- Data: 2026-05-01
- Frente ativa: R1.11a
- Baseline documental vigente: `docs/llm/InsightLab_One_Documento_Mestre_V52.txt`
- Commit baseline: `a1e8072 docs(master): add V52 preflight handoff checklist`
- Registro de abertura da janela: `governance/REGISTRO_ABERTURA_JANELA_PILOTO_POS_V52_20260501.md`
- Registro de pre-voo: `governance/REGISTRO_PRE_VOO_NOVO_CHAT_BLOCO_20260501.md`

## 2. Responsaveis

- Responsavel pela execucao: Renato Pereira da Silva — 41997343519
- Responsavel pela decisao final: Renato Pereira da Silva — 41997343519

## 3. Contexto da rodada

Esta rodada pos-V52 foi aberta apos validacao real de pre-voo em 2026-05-01.

A rodada anterior registrada em `governance/RELATORIO_EXECUCAO_JANELA_PILOTO.md` permanece preservada como historico abortado, pois em 2026-04-15 a API estava indisponivel em `localhost:4000`.

Nesta nova rodada, o ambiente local foi validado previamente com:

- Docker ativo
- containers principais UP
- banco `insightlab_one` acessivel via `pg_old_inspect` na porta 5433
- API Nest ativa na porta 4000
- login real validado
- Bearer token emitido
- rota protegida `/v1/clients` autenticada retornando JSON valido

## 4. Escopo permitido da execucao

Esta execucao deve permanecer restrita ao baseline minimo ja aprovado para piloto/go-live controlado.

Escopo permitido:

- login real com usuario demo
- leitura autenticada de `clients`
- leitura autenticada da massa minima necessaria ao piloto
- criacao de `appointment`
- criacao de `attendance`
- transicao `attendance OPEN -> IN_PROGRESS -> FINISHED`
- criacao de `fiscal-document`
- transicao fiscal `DRAFT -> REQUESTED -> AUTHORIZED`

Fora de escopo nesta rodada:

- expansao funcional
- hardening adicional nao planejado
- alteracao de schema
- alteracao de migrations
- alteracao de seeds
- reabertura tecnica da R1.10
- ajuste de modulos estabilizados sem bloco proprio

## 5. Checklist de entrada da execucao

- [x] Registro de pre-voo criado
- [x] Documento-Mestre V52 criado e versionado
- [x] Registro de abertura pos-V52 criado e versionado
- [x] Git limpo antes da criacao deste relatorio
- [x] API ja validada previamente na porta 4000
- [x] Banco operacional ja validado previamente
- [x] Login e rota protegida ja validados previamente

## 6. Marcador da rodada

- Marcador: PENDENTE_DE_GERACAO
- Motivo: marcador sera gerado no momento da execucao operacional do baseline

## 7. IDs criados/afetados

Preencher apos execucao:

- Appointment: PENDENTE
- Attendance: PENDENTE
- Fiscal-document: PENDENTE
- Outros IDs afetados: PENDENTE

## 8. Status final de cada etapa

Preencher apos execucao:

- Fase 1 — confirmar contexto minimo: PENDENTE
- Fase 2 — autenticar com usuario operacional: PENDENTE
- Fase 3 — levantar massa minima necessaria: PENDENTE
- Fase 4 — criar appointment: PENDENTE
- Fase 5 — criar attendance: PENDENTE
- Fase 6 — transicionar attendance ate FINISHED: PENDENTE
- Fase 7 — criar fiscal-document: PENDENTE
- Fase 8 — transicionar fiscal-document ate AUTHORIZED: PENDENTE
- Fase 9 — registrar evidencias finais: PENDENTE

## 9. Resultado final da rodada

- Status final: PENDENTE
- Decisao: PENDENTE
- Observacoes: aguardando execucao operacional do baseline pos-V52

## 10. Criterio de encerramento

A execucao so podera ser encerrada como aprovada se forem comprovados:

- login real bem-sucedido
- token valido utilizado em rotas protegidas
- massa minima lida com sucesso
- appointment criado
- attendance criado
- attendance transicionado ate FINISHED
- fiscal-document criado
- fiscal-document transicionado ate AUTHORIZED
- Git status revisado ao final

## 11. Condicao de abortagem

A rodada deve ser marcada como ABORTADA se ocorrer:

- API indisponivel em `localhost:4000`
- banco indisponivel
- falha de login
- falha de permissao nao esperada
- falha de criacao de entidade essencial do baseline
- necessidade de alterar codigo, schema, migrations ou seed para concluir a rodada

## 12. Rollback minimo

Se a rodada falhar:

- interromper novas operacoes
- registrar o ponto exato da falha
- preservar evidencias do erro
- nao corrigir produto dentro desta rodada
- abrir bloco tecnico separado se houver necessidade real de ajuste

## 13. Encerramento do relatorio

- Responsavel pelo registro: Renato Pereira da Silva
- Data do registro: 2026-05-01
- Status: relatorio preparado para execucao controlada da janela pos-V52

## 14. Atualizacao operacional real desta sessao

### Escopo efetivamente executado
- esta sessao ficou restrita ao preflight real de runtime e ao smoke minimo controlado
- nenhuma criacao de `appointment`, `attendance` ou `fiscal-document` foi executada neste bloco
- nenhuma alteracao de codigo, schema, migration ou seed foi realizada

### Evidencias objetivas observadas
- `git status --short --branch` no inicio: `## main`
- `docker ps`: containers principais UP
- `pg_old_inspect`: ativo na porta `5433`
- `pg_isready -U insightlab -d insightlab_one`: aceitando conexoes
- banco `insightlab_one`: acessivel
- schema `public`: `37` tabelas
- a API nao estava ativa em `localhost:4000` no inicio da sessao
- a API foi iniciada nesta sessao via `pnpm start:dev` em `services/api`
- boot confirmado por log real: `Nest application successfully started`
- `GET /v1/clients` sem token: `401 Unauthorized`
- `POST /v1/auth/login`: `201 Created`
- emissao de `accessToken`: confirmada
- emissao de `refreshToken`: confirmada
- usuario autenticado: `admin@mix-demo.local`
- `tenantId`: `cmnez9vyp000gbb10g7pwbgjs`
- `unitId`: `cmnez9vzr000ibb10hg4mrcae`
- `GET /v1/clients` com Bearer: `200` com `2` registros
- `GET /v1/professionals`: `200` com `2` registros
- `GET /v1/services-catalog`: `200` com `3` registros
- `GET /v1/units`: `200` com `8` registros
- `GET /v1/fiscal-documents`: `200` com `15` registros

### Decisao deste bloco
- Status: `APROVADO COM RESSALVAS`
- Decisao: smoke minimo pos-V52 aprovado; nao avancar para criacao de entidades antes da abertura do proximo bloco operacional controlado
- Ressalva objetiva: o `git status` final deixa de ficar limpo apenas pela atualizacao deste relatorio de governanca

### Proximo passo objetivo
- abrir o bloco seguinte para o baseline operacional repetivel completo:
  - criar `appointment`
  - criar `attendance`
  - transicionar `attendance` ate `FINISHED`
  - criar `fiscal-document`
  - transicionar fiscal ate `AUTHORIZED`

## 15. Observacao operacional pos-Codex

Apos a execucao do Codex, foi feita validacao manual adicional de listeners locais.

Resultado observado:
- banco `pg_old_inspect` permaneceu ativo na porta `5433`
- API em `localhost:4000` nao permaneceu ativa apos o encerramento/retorno da execucao Codex

Interpretacao:
- o smoke minimo executado pelo Codex permanece valido como evidencia da sessao
- porem, para demonstracao ao cliente ou execucao do baseline completo, a API deve ser mantida em terminal dedicado ou processo controlado fora da sessao efemera do Codex
- Codex pode apoiar validacao, smoke e registro de evidencia, mas nao deve ser tratado como host persistente do runtime da API

Decisao:
- antes de qualquer demonstracao ao cliente ou execucao do fluxo completo, subir a API novamente em terminal dedicado e confirmar `localhost:4000`