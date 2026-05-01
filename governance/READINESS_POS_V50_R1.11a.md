# READINESS POS-V50 - R1.11a

## Status
Validado.

## Baseline
- Documento-Mestre: V50
- Commit local: 8eef769
- Branch: main
- R1.10: congelada no corte MVP

## Evidencias validadas
- Git limpo apos V50
- Suite da API verde: 25 suites / 63 testes
- Banco operacional ativo na porta 5433
- API iniciada com sucesso na porta 4000
- Login real validado com usuario demo
- Rota protegida sem token retornou 401
- Rota protegida com token retornou 200
- Readiness minimo validado:
  - /v1/tenants: 200
  - /v1/units: 200
  - /v1/business-settings: 200
  - /v1/permissions: 200
  - /v1/fiscal-documents: 200
  - Build da API executado com sucesso via `pnpm build`
  - Pós-build com Git limpo
  - Diretório `services/api/dist` presente sem alteração pendente no Git

## Decisao
A baseline pos-V50 esta apta para continuidade da R1.11a.

## Restricao
Nao reabrir estoque, compras ou suprimentos da R1.10 sem evidencia nova e objetiva.

## Observacao operacional
O banco operacional atual esta acessivel via container pg_old_inspect na porta 5433. Apesar do nome historico, a base contem schema, migrations e dados coerentes com a baseline atual.

Normalizacao de nome/porta fica como divida controlada, nao bloqueio imediato.
