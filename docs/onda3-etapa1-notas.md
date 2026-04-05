# InsightLab One — Onda 3 / Etapa 1

## Quando você entra com execução local
### Execução local possível, mas ainda não é o melhor ponto
Se a Onda 2 estiver aplicada e estável, você já pode aplicar este pacote apenas para evoluir o schema da agenda.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma migrate dev --name onda3_agenda_base

## Melhor ponto de conforto
Depois da Etapa 2, quando a agenda já tiver DTOs, endpoints e services com Prisma.

## Observação
Aqui a recomendação é: aplicar se você quiser adiantar banco. Para validação funcional da agenda, melhor aguardar a próxima etapa.
