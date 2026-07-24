# REGISTRO — PROVA DE CONCEITO DE RLS NO PAYMENT

## 1. Contexto

Decorrência direta de `DECISAO_MULTITENANCY_E_DEPLOY_R1.md`, que confirmou shared schema + `tenant_id` + RLS, mas apontou que RLS não estava ativado — isolamento dependia inteiramente de filtros manuais no código.

## 2. Achado no caminho: aplicação conectava como superuser

Primeira tentativa de ativar RLS na tabela `Payment` não teve efeito nenhum. Investigação revelou que o papel `insightlab` (usado pelo `.env` desde sempre) é `rolsuper=true, rolbypassrls=true`. Superuser do Postgres sempre ignora RLS, mesmo com `FORCE ROW LEVEL SECURITY` — não há como contornar isso mantendo o papel como superuser.

## 3. Correção aplicada

- Criado papel novo `insightlab_app` (`rolsuper=false, rolbypassrls=false, rolcanlogin=true`), com apenas `SELECT/INSERT/UPDATE/DELETE` nas tabelas — sem privilégio de DDL.
- `.env` (raiz e `services/api/`) atualizado: `DATABASE_URL` agora aponta pro papel restrito; nova variável `DATABASE_OWNER_URL` guarda a conexão do papel owner/superuser, usada exclusivamente para rodar migrations.
- `PrismaService.withTenant(tenantId, fn)`: abre transação e roda `SELECT set_config('app.tenant_id', $1, true)` (parametrizado, escopo LOCAL) antes das queries.
- `PaymentsService` migrado por completo pra usar `withTenant` nos 5 métodos.
- Migration `20260724131208_enable_rls_payment_poc`: `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` + policy `tenant_isolation` na tabela `Payment`.

## 4. Validação ao vivo

- Via API (`GET /v1/payments`, contexto de tenant correto via `withTenant`): 200, retorna o payment existente.
- Conexão direta como `insightlab_app`, sem `app.tenant_id` setado: 0 linhas (fecha por padrão).
- Conexão direta com `app.tenant_id` de tenant inexistente: 0 linhas.
- Conexão direta com `app.tenant_id` do tenant real: 1 linha.

Suíte completa: 26 suítes / 79 testes verdes após o migration aplicado.

## 5. O que não foi feito agora

- Rollout pras outras ~20 tabelas multi-tenant (Client, Appointment, Sale, etc.) — fica como próxima etapa, tabela por tabela ou em lote, com o mesmo padrão já validado aqui.
- Troca da senha do `insightlab_app` (foi definida pelo usuário como uma senha simples, adequada pra dev local — trocar antes de qualquer ambiente além do dev).
- `PaymentEvent`/trilha de auditoria — segue fora de escopo, como já registrado no Bloco 27.

## 6. Classificação final

MECANISMO VALIDADO — pronto pra virar rollout formal (ONDA|FASE|ETAPA) nas demais tabelas quando priorizado.
