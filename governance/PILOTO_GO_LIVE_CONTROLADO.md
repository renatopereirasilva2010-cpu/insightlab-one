# PILOTO / GO-LIVE CONTROLADO

## 1. Identificacao da janela
- bloco: Piloto / go-live controlado com governanca minima
- frente ativa: R1.11a
- baseline funcional preservada: R1.8.x
- base documental obrigatoria:
  - `AGENTS.md`
  - `RUN-SUMMARY.md`
  - apoio complementar: `READINESS-R1.11a.md`
- status da janela neste corte: apta para abertura controlada sob responsavel nominal definido

## 2. Criterio objetivo de uso do piloto
- usar esta janela apenas para piloto controlado no escopo minimo ja validado do MVP
- nao usar esta janela para expansao funcional, hardening adicional, mudanca estrutural ou reabertura tecnica da R1.11a
- abrir a janela somente se houver:
  - responsavel de execucao identificado nominalmente
  - responsavel de decisao final identificado nominalmente
  - evidencias minimas aceitas disponiveis e rastreaveis

## 3. Responsavel pela execucao
- obrigatorio registrar nome e contato antes da abertura da janela
- sem responsavel nominal, a janela nao deve ser aberta

## 4. Responsavel pela decisao final
- obrigatorio registrar nome e contato antes da abertura da janela
- a decisao final da janela nao pode ficar implicita

## 5. Evidencias minimas aceitas para a janela
- `RUN-SUMMARY.md` com consolidacao de evidencias de 2026-04-05 e 2026-04-08
- `READINESS-R1.11a.md` com readiness minimo verde para piloto/go-live controlado
- evidencias objetivas ja aceitas neste corte:
  - `pnpm lint` executavel
  - `pnpm test` executavel
  - runtime validado no ambiente real atual
  - autenticacao minima validada: `POST /v1/auth/login` com `201 Created`
  - leitura autenticada minima validada: `GET /v1/clients` com `200 OK`
  - massa minima acessivel no ambiente validado
  - fluxo-piloto unico executado ponta a ponta com appointment, attendance e fiscal-document autorizado

## 6. Fluxo-piloto validado como baseline repetivel
- login
- leitura autenticada de `clients`
- leitura autenticada de massa minima necessaria ao piloto
- criacao de `appointment`
- criacao de `attendance`
- transicao `attendance OPEN -> IN_PROGRESS -> FINISHED`
- criacao de `fiscal-document`
- transicao fiscal `DRAFT -> REQUESTED -> AUTHORIZED`
- este fluxo e o baseline repetivel do corte atual

## 7. Rollback manual minimo
- se a janela precisar ser interrompida, abortar novas operacoes de piloto e retornar ao corte operacional ja validado
- preservar baseline funcional e nao tocar em produto, schema, migrations, seeds ou modulos fiscais ja estabilizados
- usar como referencia de retorno apenas o corte documentado em:
  - `RUN-SUMMARY.md`
  - `READINESS-R1.11a.md`
- qualquer necessidade de correcao de produto, runtime ou dados sai desta governanca minima e deve ser tratada como extrapolacao de escopo

## 8. Registro operacional enxuto
- registrar apenas:
  - data e hora de abertura da janela
  - responsavel pela execucao
  - responsavel pela decisao final
  - evidencias usadas como base
  - ocorrencias objetivas da janela
  - decisao final da janela
- evitar narrativa longa
- registrar somente fatos operacionais e desvios reais

## 9. Decisao final da janela
- estado inicial recomendado deste corte: APROVADO COM RESSALVAS
- ressalvas objetivas:
  - responsavel pela execucao precisa ser identificado nominalmente antes da abertura
  - responsavel pela decisao final precisa ser identificado nominalmente antes da abertura
- estados permitidos no fechamento:
  - APROVADO
  - APROVADO COM RESSALVAS
  - ABORTADO

## 10. Observacoes e riscos reais
- o corte atual e suficiente para piloto controlado, nao para ampliacao de escopo
- o lint permanece pragmatico e nao equivale a hardening semantico completo
- o warning historico de teardown/open handles permanece apenas como ponto de monitoramento, nao como bloqueio reproduzido nesta trilha
- o evento `EADDRINUSE` deve ser tratado somente como ocorrencia operacional de segunda instancia concorrente na porta `4000`
- ausencia de responsavel nominal invalida a abertura da janela
- qualquer desvio que exija mexer em produto, infraestrutura ou dados deve interromper esta trilha de governanca minima
