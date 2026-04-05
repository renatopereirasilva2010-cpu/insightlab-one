# InsightLab One — Onda 7 / Etapa 2

## Quando você entra com execução local
### Agora a execução local já é recomendada para validar comportamento inicial de comissão e diferido
Se a Onda 7 / Etapa 1 já estiver aplicada, você já pode aplicar este pacote.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm start:dev
3. testar:
   - GET /v1/commissions
   - POST /v1/commissions/generate
   - POST /v1/commissions/:id/release
   - POST /v1/commissions/:id/block
   - validar pagamento diferido com vencimento

## Melhor ponto de conforto
Após a Etapa 3, com testes e refinamentos de erro, a base complementar financeira ficará mais redonda.
