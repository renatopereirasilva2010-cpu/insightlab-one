# InsightLab One — Onda 6 / Etapa 3

## Quando você entra com execução local
### Agora a execução local da base financeira é fortemente recomendada
Se a Onda 6 / Etapa 1 e 2 já estiverem aplicadas, este é um ótimo momento para validar pagamentos e caixa.

## Ordem sugerida
1. aplicar este pacote
2. rodar:
   - cd services/api
   - pnpm test
   - pnpm start:dev
3. testar manualmente:
   - criação de pagamento
   - pagamento duplicado marcado como pago
   - venda concluída por pagamento suficiente
   - abertura de caixa duplicada
   - fechamento inválido de caixa

## Resultado esperado
A base financeira inicial fica pronta para sustentar comissão, liberação condicionada e pagamento diferido mais sofisticado.
