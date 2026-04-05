# InsightLab One — Onda 2 / Etapa 2

## Quando você entra com execução local
### Agora a execução local já é recomendada
Se a Onda 1 estiver rodando e o schema da Onda 2 / Etapa 1 já tiver sido aplicado, você já pode aplicar este pacote.

## Ordem sugerida
1. aplicar os arquivos desta etapa
2. rodar:
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma db seed
   - pnpm start:dev

## Testes manuais sugeridos
- GET /v1/clients
- POST /v1/clients
- GET /v1/professionals
- POST /v1/professionals
- GET /v1/services-catalog
- POST /v1/services-catalog
- GET /v1/products
- GET /v1/supplies
- GET /v1/resources
- GET /v1/unit-conversions

## Melhor ponto de conforto
Após a Etapa 3, com testes e ajustes finos, a base da Onda 2 estará mais redonda.
