# InsightLab One — Onda 4 / Etapa 2

## Quando você entra com execução local
### Agora a execução local já é recomendada para validar comportamento inicial do atendimento
Se a Onda 4 / Etapa 1 já estiver aplicada, você já pode aplicar este pacote.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm start:dev
3. testar:
   - GET /v1/attendances
   - POST /v1/attendances
   - POST /v1/attendances/:id/start
   - POST /v1/attendances/:id/in-progress
   - POST /v1/attendances/:id/finish
   - POST /v1/attendances/:id/cancel

## Melhor ponto de conforto
Após a Etapa 3, com testes e refinamentos de erro, a base do atendimento ficará mais redonda.
