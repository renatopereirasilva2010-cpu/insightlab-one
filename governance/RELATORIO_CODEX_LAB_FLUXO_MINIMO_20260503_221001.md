# RELATORIO CODEX LAB FLUXO MINIMO

## 1. Data/hora
- Data da execucao: 2026-05-03
- Janela observada: 2026-05-04T01:10Z a 2026-05-04T01:13Z

## 2. Marcador
- `codexlab_20260503_221001`

## 3. Ambiente usado
- API Lab: `http://localhost:4001`
- Banco Lab: `postgresql://insightlab:insightlab123@localhost:5434/insightlab_one_codex_lab?schema=public`
- Confirmacao SQL via Prisma Client: `db=insightlab_one_codex_lab`, `schema=public`

## 4. Confirmacao de uso exclusivo de 4001
- Todas as chamadas HTTP desta rodada usaram somente `http://localhost:4001`
- Nenhuma chamada foi feita para `http://localhost:4000`

## 5. Confirmacao de uso exclusivo de insightlab_one_codex_lab
- Toda validacao de banco desta rodada usou somente `insightlab_one_codex_lab`
- Nenhuma conexao foi feita para `localhost:5433`
- Nenhuma conexao foi feita para o banco canonico `insightlab_one`

## 6. Comandos principais
- `git status --short --branch`
- `curl -i http://localhost:4001/v1/clients`
- `curl -X POST http://localhost:4001/v1/auth/login`
- `curl` autenticado para:
  - `/v1/clients`
  - `/v1/professionals`
  - `/v1/services-catalog`
  - `/v1/appointments`
  - `/v1/attendances`
  - `/v1/sales`
  - `/v1/payments`
  - `/v1/cash-register`
  - `/v1/commissions`
  - `/v1/fiscal-documents`
- `pnpm --filter api exec tsx -e '... PrismaClient ... $queryRawUnsafe(...) ...'`
- POSTs do fluxo:
  - `/v1/cash-register/open`
  - `/v1/appointments`
  - `/v1/attendances`
  - `/v1/attendances/:id/in-progress`
  - `/v1/attendances/:id/finish`
  - `/v1/sales`
  - `/v1/sales/:id/items`
  - `/v1/sales/:id/recalculate`
  - `/v1/sales/:id/ready-for-checkout`
  - `/v1/payments`
  - `/v1/payments/:id/mark-paid`
  - `/v1/commissions/generate`
  - `/v1/fiscal-documents`
  - `/v1/fiscal-documents/:id/status` (`REQUESTED`)
  - `/v1/fiscal-documents/:id/status` (`AUTHORIZED`)
  - `/v1/cash-register/:id/close`

## 7. Payloads principais
- Abertura de caixa:
```json
{"name":"Caixa codexlab_20260503_221001","openingBalance":50,"notes":"codexlab_20260503_221001 cash open"}
```
- Appointment:
```json
{"clientId":"cmnhxehc4000913odngppr0xt","professionalId":"cmnhxehch000b13odigo7v1ps","serviceId":"cmnjct2zz0001i8fl5j1hcaz5","startAt":"2026-06-30T15:00:00.000Z","endAt":"2026-06-30T16:00:00.000Z","notes":"codexlab_20260503_221001 appointment"}
```
- Attendance:
```json
{"appointmentId":"cmoqiagwm0003ra0qbjh7re3g","clientId":"cmnhxehc4000913odngppr0xt","professionalId":"cmnhxehch000b13odigo7v1ps","serviceId":"cmnjct2zz0001i8fl5j1hcaz5","notes":"codexlab_20260503_221001 attendance"}
```
- Sale item:
```json
{"itemType":"SERVICE","serviceId":"cmnjct2zz0001i8fl5j1hcaz5","description":"codexlab_20260503_221001 service item","quantity":1,"unitPrice":89.9}
```
- Payment:
```json
{"saleId":"cmoqiahog0007ra0qi8ehciu1","method":"PIX","amount":89.9,"cashRegisterId":"cmoqiagpn0001ra0q9hp34010","externalReference":"codexlab_20260503_221001 payment","notes":"codexlab_20260503_221001 payment"}
```
- Commission:
```json
{"saleId":"cmoqiahog0007ra0qi8ehciu1","professionalId":"cmnhxehch000b13odigo7v1ps","baseAmount":89.9,"commissionAmount":26.97,"notes":"codexlab_20260503_221001 commission"}
```
- Fiscal document:
```json
{"sourceType":"PAYMENT","sourceId":"cmoqiai9t000bra0qaeo1qz1h","documentType":"NFSE","provider":"CODEX_LAB"}
```
- Fiscal status `REQUESTED`:
```json
{"status":"REQUESTED","message":"codexlab_20260503_221001 fiscal requested"}
```
- Fiscal status `AUTHORIZED`:
```json
{"status":"AUTHORIZED","message":"codexlab_20260503_221001 fiscal authorized","referenceNumber":"NFSE-codexlab_20260503_221001","accessKey":"KEY-codexlab_20260503_221001"}
```

## 8. IDs criados
- `cashRegisterId`: `cmoqiagpn0001ra0q9hp34010`
- `appointmentId`: `cmoqiagwm0003ra0qbjh7re3g`
- `attendanceId`: `cmoqiah6q0005ra0q3hgbx406`
- `saleId`: `cmoqiahog0007ra0qi8ehciu1`
- `saleItemId`: `cmoqiai0o0009ra0q61vt4vzf`
- `paymentId`: `cmoqiai9t000bra0qaeo1qz1h`
- `commissionId`: `cmoqiaife000dra0q7321jygd`
- `fiscalDocumentId`: `cmoqiaimd000fra0qhxydce9m`

## 9. Respostas HTTP principais
- `GET /v1/clients` sem token: `401 Unauthorized`
- `POST /v1/auth/login`: `201 Created`
- `GET /v1/clients` com Bearer: `200 OK`
- `GET` das rotas principais do Lab: `200 OK`
- `POST /v1/cash-register/open`: `201 Created`
- `POST /v1/appointments`: `201 Created`
- `POST /v1/attendances`: `201 Created`
- `POST /v1/attendances/:id/in-progress`: `201 Created`
- `POST /v1/attendances/:id/finish`: `201 Created`
- `POST /v1/sales`: `201 Created`
- `POST /v1/sales/:id/items`: `201 Created`
- `POST /v1/sales/:id/recalculate`: `201 Created`
- `POST /v1/sales/:id/ready-for-checkout`: `201 Created`
- `POST /v1/payments`: `201 Created`
- `POST /v1/payments/:id/mark-paid`: `201 Created`
- `POST /v1/commissions/generate`: `201 Created`
- `POST /v1/fiscal-documents`: `201 Created`
- `POST /v1/fiscal-documents/:id/status` (`REQUESTED`): `201 Created`
- `POST /v1/fiscal-documents/:id/status` (`AUTHORIZED`): `201 Created`
- `POST /v1/cash-register/:id/close`: `201 Created`
- `GET /v1/fiscal-documents/:id`: `200 OK`

## 10. Status final de appointment
- `SCHEDULED`

## 11. Status final de attendance
- `FINISHED`

## 12. Status final de sale
- `COMPLETED`

## 13. Status final de payment
- `PAID`

## 14. Status final de cash-register
- `CLOSED`

## 15. Status final de commission
- `RELEASED`

## 16. Status final de fiscal-document
- `AUTHORIZED`

## 17. Riscos
- O endpoint de validacao SQL por `psql` nao pode ser usado nesta maquina porque `psql` nao esta instalado; a confirmacao de banco precisou ser feita via Prisma Client.
- O `inet_server_port()` retornou a porta interna `5432` do servidor PostgreSQL, enquanto a conexao externa usada na rodada foi `localhost:5434`; isso e compativel com exposicao de porta Docker, mas convem manter essa distincao documentada para evitar leitura equivocada.
- O `appointment` permaneceu em `SCHEDULED` mesmo com `attendance` finalizado; isso reflete o comportamento atual do dominio, mas vale decidir se essa divergencia e aceitavel no corte de go-live.

## 18. Pendencias
- Decidir se o fluxo alvo deve sincronizar automaticamente `appointment` com a finalizacao do `attendance`.
- Definir se a evidencia desta rodada sera mantida no Lab ou limpa por marcador.

## 19. Recomendacao final
- `APROVADO COM RESSALVAS`
- Ressalva principal: existe divergencia de status entre `appointment` (`SCHEDULED`) e `attendance` (`FINISHED`), embora o restante do trilho operacional tenha fechado com sucesso.

## 20. Opcao de rollback / limpeza recomendada
- Opcao A — manter evidencia no Lab para inspecao posterior desta rodada marcada por `codexlab_20260503_221001`

## 21. Evidencias geradas
- Log de checkpoint: [.codex-runs/checkpoint_lab_codexlab_20260503_221001.log](/home/renato/projects/insightlab-one/workspace/.codex-runs/checkpoint_lab_codexlab_20260503_221001.log)
- Log do fluxo: [.codex-runs/flow_lab_codexlab_20260503_221001.log](/home/renato/projects/insightlab-one/workspace/.codex-runs/flow_lab_codexlab_20260503_221001.log)
