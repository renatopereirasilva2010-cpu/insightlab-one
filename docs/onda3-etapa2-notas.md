# InsightLab One — Onda 3 / Etapa 2

## Quando você entra com execução local
### Agora a execução local já é recomendada para validar comportamento inicial da agenda
Se a Onda 3 / Etapa 1 já estiver aplicada, você já pode aplicar este pacote.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm start:dev
3. testar:
   - GET /v1/appointments
   - POST /v1/appointments
   - GET /v1/availability
   - POST /v1/appointment-blocks
   - POST /v1/appointments/:id/cancel
   - POST /v1/appointments/:id/no-show

## Melhor ponto de conforto
Após a Etapa 3, com testes e refinamentos de erro, a base da agenda ficará mais redonda.
