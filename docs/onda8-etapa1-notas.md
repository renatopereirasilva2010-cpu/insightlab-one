# InsightLab One — Onda 8 / Etapa 1

## Quando você entra com execução local
### Execução local possível, mas ainda não é o melhor ponto
Se a Onda 7 estiver aplicada e estável, você já pode aplicar este pacote para evoluir o schema do admin master ampliado.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma migrate dev --name onda8_admin_master_governanca_base

## Melhor ponto de conforto
Depois da Etapa 2, quando migração assistida e wiring inicial já estiverem entregues.

## Observação
Aqui a recomendação é: aplicar se você quiser adiantar banco. Para validação funcional do admin master ampliado, melhor aguardar a próxima etapa.
