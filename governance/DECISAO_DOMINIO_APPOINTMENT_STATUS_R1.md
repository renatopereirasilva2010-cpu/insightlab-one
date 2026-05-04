# DECISÃO DE DOMÍNIO — STATUS DO APPOINTMENT NO MVP/R1

## 1. Contexto

Durante a execução controlada do Codex Lab no ambiente clonado, a rodada marcada como `codexlab_20260503_221001` validou o fluxo mínimo:

appointment -> attendance -> sale -> payment -> cash-register -> commission -> fiscal-document

A rodada foi executada exclusivamente no ambiente Lab:

- API Lab: `http://localhost:4001`
- Banco Lab: `insightlab_one_codex_lab`
- Postgres limpo: `localhost:5434`

O fluxo fechou com sucesso nos principais objetos operacionais:

- `attendance`: `FINISHED`
- `sale`: `COMPLETED`
- `payment`: `PAID`
- `cash-register`: `CLOSED`
- `commission`: `RELEASED`
- `fiscal-document`: `AUTHORIZED`

A observação registrada foi que o `appointment` permaneceu com status `SCHEDULED`.

## 2. Decisão para o MVP/R1

No MVP/R1, o `appointment` será tratado como registro de agenda/planejamento.

O `attendance` será tratado como a fonte da verdade da execução operacional do atendimento.

Portanto, é aceitável no corte MVP/R1 que um `appointment` permaneça `SCHEDULED` mesmo quando o `attendance` vinculado estiver `FINISHED`.

## 3. Regra operacional aceita

Para leitura de execução do serviço:

- usar `Attendance.status`

Para leitura do compromisso originalmente agendado:

- usar `Appointment.status`

No MVP/R1, a finalização do atendimento não exige atualização automática do status do agendamento.

## 4. Justificativa

A sincronização automática do status do `appointment` com o ciclo de vida do `attendance` pode impactar:

- contratos de API;
- filtros de agenda;
- telas operacionais;
- relatórios;
- entendimento de agenda futura versus atendimento executado;
- regras de cancelamento/no-show;
- histórico de status.

Como o fluxo operacional-financeiro-fiscal fechou corretamente, a ausência de sincronização automática não bloqueia o MVP/R1.

## 5. Classificação da ressalva

A ressalva da rodada Codex Lab deixa de ser tratada como falha bloqueante e passa a ser classificada como:

APROVADO COM DECISÃO DE DOMÍNIO GOVERNADA PARA O MVP/R1.

## 6. O que não será feito agora

No MVP/R1, não será feito:

- alteração de `schema.prisma`;
- criação de migration;
- alteração automática de status do `appointment`;
- alteração em guards/autorização;
- alteração ampla de core;
- mudança de contrato de API apenas para sincronizar status.

## 7. Encaminhamento futuro

Para R1.1/R2, avaliar uma evolução de sincronização controlada, por exemplo:

- `attendance` criado -> `appointment` poderia ir para `CHECKED_IN`;
- `attendance` iniciado -> `appointment` poderia ir para `IN_SERVICE`;
- `attendance` finalizado -> `appointment` poderia ir para `COMPLETED`, `ATTENDED` ou status equivalente.

Essa evolução deve ser tratada como decisão de produto/domínio e não como correção emergencial do MVP/R1.

## 8. Decisão final

O comportamento atual é aceito no MVP/R1.

A rodada Codex Lab `codexlab_20260503_221001` pode ser registrada como aprovada para o corte atual, com decisão de domínio documentada.

Recomendação:

APROVADO COM DECISÃO DE DOMÍNIO GOVERNADA.