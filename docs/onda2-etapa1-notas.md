# InsightLab One — Onda 2 / Etapa 1

## Quando você entra com execução local
### Execução local recomendada após revisar este pacote
Você já pode aplicar este pacote no ambiente local se:
1. a Onda 1 estiver rodando localmente
2. o Prisma já estiver funcional
3. o seed da Onda 1 já tiver sido executado

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma migrate dev --name onda2_core_entities
3. validar o schema
4. aguardar a Etapa 2 para endpoints e seeds operacionais

## Observação
Se quiser reduzir retrabalho, o melhor ponto de execução mais “confortável” será após a Etapa 2.
