# InsightLab One — Onda 5 / Etapa 1

## Quando você entra com execução local
### Execução local possível, mas ainda não é o melhor ponto
Se a Onda 4 estiver aplicada e estável, você já pode aplicar este pacote apenas para evoluir o schema da venda.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma migrate dev --name onda5_venda_base

## Melhor ponto de conforto
Depois da Etapa 2, quando a venda já tiver DTOs, endpoints e services com Prisma.

## Observação
Aqui a recomendação é: aplicar se você quiser adiantar banco. Para validação funcional da venda, melhor aguardar a próxima etapa.
