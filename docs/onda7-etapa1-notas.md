# InsightLab One — Onda 7 / Etapa 1

## Quando você entra com execução local
### Execução local possível, mas ainda não é o melhor ponto
Se a Onda 6 estiver aplicada e estável, você já pode aplicar este pacote para evoluir o schema de comissão e diferido.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma migrate dev --name onda7_comissao_diferido_base

## Melhor ponto de conforto
Depois da Etapa 2, quando comissão e diferido já tiverem DTOs, endpoints e services com Prisma.

## Observação
Aqui a recomendação é: aplicar se você quiser adiantar banco. Para validação funcional de comissão/diferido, melhor aguardar a próxima etapa.
