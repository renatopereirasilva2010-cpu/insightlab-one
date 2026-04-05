# InsightLab One — Onda 6 / Etapa 2

## Quando você entra com execução local
### Agora a execução local já é recomendada para validar comportamento inicial de checkout, pagamento e caixa
Se a Onda 6 / Etapa 1 já estiver aplicada, você já pode aplicar este pacote.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm start:dev
3. testar:
   - GET /v1/payments
   - POST /v1/payments
   - GET /v1/cash-register
   - POST /v1/cash-register/open
   - POST /v1/cash-register/:id/close
   - POST /v1/payments/:id/mark-paid

## Melhor ponto de conforto
Após a Etapa 3, com testes e refinamentos de erro, a base financeira inicial ficará mais redonda.
