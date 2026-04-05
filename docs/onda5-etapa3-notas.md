# InsightLab One — Onda 5 / Etapa 3

## Quando você entra com execução local
### Agora a execução local da venda é fortemente recomendada
Se a Onda 5 / Etapa 1 e 2 já estiverem aplicadas, este é um ótimo momento para validar a venda.

## Ordem sugerida
1. aplicar este pacote
2. rodar:
   - cd services/api
   - pnpm test
   - pnpm start:dev
3. testar manualmente:
   - criação de venda
   - venda sem itens indo para checkout
   - adição de item de serviço
   - adição de item de produto
   - recálculo
   - cancelamento
   - listagem de vendas

## Resultado esperado
A base da venda fica pronta para sustentar checkout, pagamento e caixa.
