# InsightLab One — Onda 8 / Etapa 2

## Quando você entra com execução local
### Agora a execução local já é recomendada para validar o esqueleto de migração assistida
Se a Onda 8 / Etapa 1 já estiver aplicada, você já pode aplicar este pacote.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm start:dev
3. testar:
   - GET /v1/admin-master/migration-jobs
   - POST /v1/admin-master/migration-jobs
   - POST /v1/admin-master/migration-jobs/:id/import-batch
   - POST /v1/admin-master/migration-jobs/:id/reconcile

## Melhor ponto de conforto
Após a Etapa 3, com piloto e hardening, a trilha de migração ficará mais madura.
