# Guia de Retomada de Sessão — InsightLab One

**Última atualização:** 26/07/2026, ao fechar o bloco de CRUD do backend (`onda-2/backend-crud-completo`).
**Por que este arquivo existe:** se a sessão do Claude Code, tmux, WSL, VS Code ou Docker cair, este documento tem tudo que você precisa pra retomar sem precisar reconstruir contexto do zero.

**Nota 26/07/2026:** esta sessão caiu de fato — os 3 containers Docker (Postgres, Redis) pararam sozinhos (~2h sem atividade, provável queda da integração WSL↔Docker Desktop) e o processo `nest start --watch` não estava mais rodando. Nada foi perdido (working tree intacta); religuei com `docker compose up -d` + `pnpm start:dev` e confirmei a API respondendo. Se isso se repetir, rode a seção 2 (diagnóstico) e a 3.1/3.2 (subir do zero) abaixo — é rotina, não incidente.

---

## 1. Estado exato no momento em que este guia foi escrito

- **Branch ativa:** `onda-2/backend-crud-completo` (backend CRUD; a `onda-2/frontend-mvp-screens` com as telas do MVP segue intacta e separada, não tocada nesta sessão)
- **Working tree:** com mudanças **não commitadas** — todo o trabalho de CRUD desta seção (ver 4.1) está na working tree, ainda não há commit criado nem push feito
- **`main`:** parada em `5acced3` (scaffold do frontend)
- Merge, commit e push ficam pra aprovação explícita (Zona Vermelha) — nada disso foi feito ainda

### O que já está rodando (nesta máquina, agora)
| Serviço | Como está rodando | Porta | Observação |
|---|---|---|---|
| Postgres (dev real) | Docker, `insightlab_one_postgres` | 5433 | `restart: unless-stopped` — sobrevive a restart do Docker Desktop |
| Postgres (Codex Lab) | Docker, `insightlab_pg_clean` | 5434 | Ambiente isolado, não usado no dia a dia |
| Redis | Docker, `insightlab_one_redis` | 6379 | |
| API NestJS | `nest start --watch` rodando direto no processo (fora do Docker) | 4000 | PID pode mudar a cada boot da máquina; religada nesta sessão após queda |
| Frontend Next.js | **não está rodando nesta sessão** (trabalho atual é 100% backend) | 3000 | Suba com `pnpm dev` em `apps/web` só se for testar a UI |

Se você abrir uma sessão nova e Postgres/Redis/API ainda estiverem de pé, **não precisa reiniciar nada** — só confirme com os comandos da seção 2. Se estiverem parados (como aconteceu nesta sessão), use a seção 3.

---

## 2. Checklist de diagnóstico rápido (Zona Verde — sempre seguro rodar)

```bash
cd ~/projects/insightlab-one/workspace

git status
git branch --show-current
git log --oneline -5

docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

curl -s -o /dev/null -w "API: %{http_code}\n" http://localhost:4000/
curl -s -o /dev/null -w "Web: %{http_code}\n" http://localhost:3000/
```

Se a branch não for `onda-2/backend-crud-completo`, rode `git checkout onda-2/backend-crud-completo`.

---

## 3. Como subir cada peça do zero (se algo caiu)

### 3.1 Docker (Postgres + Redis)
```bash
cd ~/projects/insightlab-one/workspace/infra/docker
docker compose up -d
```
Isso é seguro rodar mesmo com os containers já de pé — o compose reconhece que já existem e não recria nada. `postgres_data` é um volume **externo** (`6b05ad09e2f4d9aad3fdb60380d1d11e49bcd0bab0f56c584fe4a5405e12947c`) que já contém os dados reais — não é criado do zero.

### 3.2 API NestJS
```bash
cd ~/projects/insightlab-one/workspace/services/api
pnpm start:dev
```
Sobe em `http://localhost:4000`, lê `.env` (`DATABASE_URL` aponta pro Postgres acima, porta 5433).

### 3.3 Frontend Next.js
```bash
cd ~/projects/insightlab-one/workspace/apps/web
pnpm dev
```
Sobe em `http://localhost:3000`. Lê `apps/web/.env.local` (`API_URL=http://localhost:4000`).

### 3.4 Login pra testar manualmente
- URL: `http://localhost:3000/login`
- Usuário admin (seed): `admin@mix-demo.local` / `Admin@12345`
- Usuário operador restrito (seed, permissões limitadas): `operador.restrito@mix-demo.local` / `Operador@12345`

---

## 4. O que foi entregue

### 4.1 Backend CRUD (26/07/2026, branch `onda-2/backend-crud-completo`, ainda não commitado)

Os 4 gaps de CRUD mapeados na seção 5 (versão anterior deste guia) foram todos fechados, cada um com teste Jest:

- `PATCH /v1/services-catalog/:id` (nome/descrição/duração/preço/status — complementa o `/fiscal` que já existia)
- `POST /v1/users`, `PATCH /v1/users/:id`, `POST /v1/users/:id/block`
- `POST /v1/roles`, `POST /v1/roles/:id/permissions`, `POST /v1/roles/:id/users` (atribuição de permissão a papel e de papel a usuário)
- `PATCH /v1/business-settings`

Validado: suíte Jest completa (**31 suítes, 138 testes, todos passando**), `tsc --noEmit` limpo (código + specs), API rodando localmente com todas as rotas mapeadas sem erro no boot.

**Pendente antes de fechar formalmente o bloco (Definition of Done da seção 6 do adendo):**
- Commit + `RUN-SUMMARY.md` — não feito ainda.
- Frontend ainda não foi ligado aos 4 novos endpoints (telas de edição de Serviços/Usuários/Papéis/Configurações reaproveitam os formulários de criação já existentes, conforme `BACKLOG_PRODUTO_E_DIFERENCIACAO.md` seção "ONDA 2.1").
- `pnpm audit --audit-level=high` acusa **16 vulnerabilidades high / 11 moderate / 7 low** — mas todas em dependências não tocadas neste bloco (`next`/`postcss`/`eslint` em `apps/web`, `@nestjs/cli`→`glob`→`brace-expansion` em dev tooling). Isso bloqueia merge pra `main` pela regra de higiene (seção 7 do adendo) — precisa de decisão/priorização antes do merge, não é algo pra ignorar.
- Merge pra `main` e qualquer deploy — Zona Vermelha, aguardando aprovação explícita.

### 4.2 Frontend (25/07/2026, branch `onda-2/frontend-mvp-screens`, commit `252ee50`, não tocado nesta sessão)

Todas as telas do núcleo do piloto (seção 2.1 do adendo de governança) foram implementadas no frontend, contra a API real já existente — não é mock:

- Agenda (`/`): agendamentos, bloqueios, disponibilidade, recursos
- Atendimentos, Vendas + Checkout, Pagamentos, Caixa, Comissões, Documentos Fiscais
- Cadastros: Clientes, Profissionais, Serviços, Produtos
- Configurações (somente leitura — hoje o backend já suporta edição, seção 4.1, falta ligar a tela)

Validado com `next build`, `tsc --noEmit`, `eslint` e smoke test manual via `curl` autenticado em todas as rotas (todas retornando 200 com dado real).

---

## 5. Pendências conhecidas (não é dívida escondida — está tudo mapeado)

1. **Ligar o frontend aos 4 endpoints novos de backend** (seção 4.1) — próximo passo natural antes de qualquer merge.
2. **`pnpm audit` com 16 `high`** em dependências de `apps/web` e dev tooling — decisão de priorização pendente antes do merge pra `main`.
3. **Sem tag Git formal pro Bloco 27** (`v1.8.5-bloco27`) — puramente administrativo, não bloqueia nada.
4. **Sem testes de frontend ainda** (`apps/web` não tem nenhum arquivo `*.test.*`) — gap pré-existente, vale endereçar.
5. **Decremento de estoque na venda de produtos** (`stockQuantity` nunca é abatido) — gap de inventário separado do CRUD, ainda não endereçado.
6. **Merge de qualquer branch pra `main` e qualquer deploy** — Zona Vermelha, aguardando aprovação explícita.

---

## 6. Fluxo de deploy combinado com Renato (25/07/2026)

**Regra fixa a partir de agora:** toda implementação nova vai primeiro pra **staging**, fica disponível pra Renato testar e validar manualmente, e só depois de validação explícita segue pra produção. Produção está suspensa desde `governance/DECISAO_PRODUCAO_SUSPENSA_PRIORIZAR_STAGING.md` — nada muda essa suspensão sem decisão nova.

- Staging: `insightlab-one-api-staging.onrender.com` (Render + Neon + Upstash)
- Produção: `srv-d9i0ecvaqgkc73c8hof0`, suspensa

---

## 7. Documentos relacionados
- `governance/insightlab-one-onda0-adendo-governanca.md` — plano geral, zonas de autonomia, corte de MVP
- `governance/DECISAO_PRODUCAO_SUSPENSA_PRIORIZAR_STAGING.md` — por que produção está pausada
- `governance/REGISTRO_VARREDURA_FINAL_BACKLOG_MVP.md` — varredura que autorizou começar o frontend
- `governance/BACKLOG_PRODUTO_E_DIFERENCIACAO.md` — backlog revisado (frontend + backend) e visão de produto/diferenciação de mercado
