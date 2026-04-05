# InsightLab One — Onda 1 / Checklist de Aceite

## Critérios de aceite da Onda 1
- [ ] API sobe sem erro
- [ ] Prisma conecta no PostgreSQL
- [ ] Migração inicial roda com sucesso
- [ ] Seed inicial executa com sucesso
- [ ] Login responde com accessToken e refreshToken
- [ ] JwtStrategy resolve usuário ativo
- [ ] Guards base estão presentes
- [ ] Tenant context pode ser resolvido
- [ ] Roles e permissions existem na base
- [ ] Business settings existem para o tenant demo
- [ ] Rotas base de tenants, units e settings respondem
- [ ] Erros seguem padrão com code/title/message/recommendedAction/traceId

## Fechamento da Onda 1
A Onda 1 pode ser considerada concluída quando:
1. auth funcional mínimo estiver de pé
2. tenant, unit e settings estiverem estáveis
3. RBAC básico estiver configurado
4. seed e migração funcionarem localmente
5. base estiver pronta para a Onda 2
