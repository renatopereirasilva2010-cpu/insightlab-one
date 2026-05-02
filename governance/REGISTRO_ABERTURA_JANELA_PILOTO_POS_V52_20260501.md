# REGISTRO DE ABERTURA DA JANELA DE PILOTO / GO-LIVE CONTROLADO POS-V52

## 1. Identificacao da rodada

- Data: 2026-05-01
- Ambiente: WSL local + Docker ativo + workspace InsightLab One
- Frente ativa: R1.11a
- Baseline documental vigente: `docs/llm/InsightLab_One_Documento_Mestre_V52.txt`
- Commit baseline: `a1e8072 docs(master): add V52 preflight handoff checklist`
- Registro de pre-voo: `governance/REGISTRO_PRE_VOO_NOVO_CHAT_BLOCO_20260501.md`
- Janela vinculada: `governance/PILOTO_GO_LIVE_CONTROLADO.md`

## 2. Responsavel pela execucao

- Nome: Renato Pereira da Silva
- Contato: 41997343519

## 3. Responsavel pela decisao final

- Nome: Renato Pereira da Silva
- Contato: 41997343519

## 4. Contexto desta abertura

Esta abertura substitui operacionalmente a tentativa anterior registrada em `governance/RELATORIO_EXECUCAO_JANELA_PILOTO.md`, que foi abortada em 2026-04-15 por indisponibilidade objetiva da API em `localhost:4000`.

Nesta rodada pos-V52, o pre-voo obrigatorio foi executado e aprovado em 2026-05-01, validando Docker, banco, API, login, Bearer token e rota protegida autenticada.

## 5. Evidencias minimas usadas como base

- `docs/llm/InsightLab_One_Documento_Mestre_V52.txt`
- `governance/REGISTRO_PRE_VOO_NOVO_CHAT_BLOCO_20260501.md`
- `governance/PILOTO_GO_LIVE_CONTROLADO.md`
- `governance/READINESS_POS_V50_R1.11a.md`
- `RUN-SUMMARY.md`

## 6. Checklist de pre-voo aprovado nesta rodada

Foram validados em 2026-05-01:

- [x] Docker Desktop / Docker Engine respondendo
- [x] Containers principais UP
- [x] PostgreSQL operacional validado
- [x] Banco correto acessivel
- [x] Tabelas principais existentes
- [x] API Nest subindo sem erro
- [x] API respondendo na porta 4000
- [x] Rota protegida sem token retornando 401
- [x] Login real com usuario demo funcionando
- [x] accessToken emitido
- [x] Rota protegida com Bearer token retornando JSON valido
- [x] Git status revisado antes da abertura

## 7. Criterio objetivo de abertura desta rodada

Esta janela deve ser usada apenas para piloto/go-live controlado dentro do corte minimo ja validado.

Nao usar esta janela para:

- expansao funcional
- hardening adicional nao planejado
- mudanca estrutural
- reabertura tecnica da R1.10
- alteracao de schema, migrations ou seeds sem bloco proprio

## 8. Baseline operacional repetivel desta rodada

A rodada pos-V52 pode seguir o baseline minimo:

- login real com usuario demo
- leitura autenticada de `clients`
- leitura autenticada da massa minima necessaria
- criacao de `appointment`
- criacao de `attendance`
- transicao `attendance OPEN -> IN_PROGRESS -> FINISHED`
- criacao de `fiscal-document`
- transicao fiscal `DRAFT -> REQUESTED -> AUTHORIZED`

## 9. Decisao de abertura da rodada

- [x] APROVADO
- [ ] APROVADO COM RESSALVAS
- [ ] ABORTADO

## 10. Ressalvas objetivas

- O corte atual e suficiente para piloto/go-live controlado, nao para ampliacao de escopo.
- A janela anterior de 2026-04-15 permanece preservada como historico abortado por runtime indisponivel.
- A abertura pos-V52 so e valida enquanto o pre-voo permanecer verde.
- Se Docker, banco, API ou autenticacao falharem, a rodada deve ser interrompida e registrada.

## 11. Rollback manual minimo de referencia

Se a janela precisar ser interrompida:

- interromper novas operacoes da rodada
- preservar baseline funcional ja validada
- nao tocar em produto, schema, migrations, seeds ou modulos estabilizados
- registrar falha objetiva no relatorio de execucao da janela
- usar como referencia de retorno:
  - `docs/llm/InsightLab_One_Documento_Mestre_V52.txt`
  - `governance/REGISTRO_PRE_VOO_NOVO_CHAT_BLOCO_20260501.md`
  - `governance/PILOTO_GO_LIVE_CONTROLADO.md`
  - `RUN-SUMMARY.md`

## 12. Observacoes operacionais

- A API ja estava UP no momento do smoke pos-V52.
- Nao deve ser iniciada uma segunda instancia da API se `localhost:4000` ja estiver respondendo.
- O smoke HTTP deve ser preferido para confirmar runtime quando a API ja estiver ativa.
- A rodada deve permanecer dentro da continuidade controlada da R1.11a.

## 13. Encerramento do registro

- Responsavel pelo registro: Renato Pereira da Silva
- Data do registro: 2026-05-01
- Status: abertura pos-V52 aprovada para preparacao/execucao controlada da janela piloto/go-live