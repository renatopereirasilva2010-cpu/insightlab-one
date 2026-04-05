# InsightLab One — Onda 1 / Notas de Execução Local

## Quando você entra com execução local
### Agora é o momento recomendado
Você já pode executar localmente a Onda 1 completa.

## Ordem sugerida
1. aplicar scaffold base da Fase 5
2. aplicar pacote da Fase 8 / Onda 1 / Etapa 2
3. aplicar pacote da Fase 8 / Onda 1 / Etapa 3
4. aplicar este pacote da Etapa 4
5. rodar:
   - pnpm install
   - docker compose up -d
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma migrate dev --name init
   - pnpm prisma db seed
   - pnpm start:dev

## Testes mínimos sugeridos
- POST /v1/auth/login
- GET /v1/tenants
- GET /v1/units
- GET /v1/business-settings

## Resultado esperado
Com a Onda 1 concluída, o ambiente backend já fica pronto para começar a Onda 2.
