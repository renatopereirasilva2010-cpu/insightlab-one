# InsightLab One — Fase 8 / Onda 1 / Etapa 2

## O que esta etapa entrega
- base de schema Prisma da Onda 1
- seed inicial de tenant demo, unidade demo, perfil admin e permissões
- módulos Nest base para:
  - auth
  - users
  - roles
  - permissions
  - tenants
  - units
  - business-settings
- common layer inicial com guards/decorators/interceptors/filters
- documentação e status da etapa

## Quando você entra com execução local
### Recomendado
Depois de revisar este pacote, você já pode:
1. copiar os arquivos para sua estrutura local
2. rodar:
   - pnpm install
   - docker compose up -d
   - pnpm prisma migrate dev --name init
   - pnpm prisma generate
   - pnpm prisma db seed
   - pnpm start:dev

### Observação
Se preferir, aguarde a próxima etapa (Onda 1 / Etapa 3), quando os endpoints e wiring com Prisma estarão mais redondos.
