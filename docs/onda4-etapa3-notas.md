# InsightLab One — Onda 4 / Etapa 3

## Quando você entra com execução local
### Agora a execução local do atendimento é fortemente recomendada
Se a Onda 4 / Etapa 1 e 2 já estiverem aplicadas, este é um ótimo momento para validar o atendimento.

## Ordem sugerida
1. aplicar este pacote
2. rodar:
   - cd services/api
   - pnpm test
   - pnpm start:dev
3. testar manualmente:
   - criação de atendimento
   - atendimento duplicado por appointment
   - início inválido
   - finalização inválida
   - cancelamento
   - listagem de atendimentos

## Resultado esperado
A base do atendimento fica pronta para sustentar a próxima onda de venda e checkout.
