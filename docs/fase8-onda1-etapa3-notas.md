# InsightLab One — Fase 8 / Onda 1 / Etapa 3

## O que esta etapa entrega
- wiring inicial com Prisma
- AuthService refinado
- JwtStrategy inicial
- controllers/services com uso do Prisma
- guards e decorators preparados
- package.json sugerido da API
- documentação da etapa

## Quando você entra com execução local
### Agora a execução local já é recomendada
Depois de revisar este pacote, você pode:
1. copiar os arquivos para o projeto local
2. rodar:
   - pnpm install
   - docker compose up -d
   - cd services/api
   - pnpm prisma generate
   - pnpm prisma migrate dev --name init
   - pnpm prisma db seed
   - pnpm start:dev
3. testar:
   - POST /v1/auth/login
   - GET /v1/tenants
   - GET /v1/units
   - GET /v1/business-settings

## Próxima etapa
Fase 8 — Onda 1 / Etapa 4
- testes mínimos
- rotas protegidas completas
- ajustes finos de RBAC
- fechamento da Onda 1
