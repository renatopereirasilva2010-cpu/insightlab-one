# InsightLab One — Onda 5 / Etapa 2

## Quando você entra com execução local
### Agora a execução local já é recomendada para validar comportamento inicial da venda
Se a Onda 5 / Etapa 1 já estiver aplicada, você já pode aplicar este pacote.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm start:dev
3. testar:
   - GET /v1/sales
   - POST /v1/sales
   - POST /v1/sales/:id/items
   - POST /v1/sales/:id/recalculate
   - POST /v1/sales/:id/ready-for-checkout
   - POST /v1/sales/:id/cancel

## Melhor ponto de conforto
Após a Etapa 3, com testes e refinamentos de erro, a base da venda ficará mais redonda.
