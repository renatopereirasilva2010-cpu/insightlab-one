# Guia de Retomada de Sessão — InsightLab One

**Última atualização:** 31/07/2026, ao fechar `insightlab-one-onda11-auditoria-multipersona.md` (auditoria multi-persona via Playwright, RBAC do sidebar corrigido pra bater com as permissões reais, widget de agendamento público ganhou logo/cor do tenant, banner de LGPD menos competitivo visualmente, `StatCard` em Minhas Comissões). Ainda não commitado/pushado nesta branch — ver seção 1. Onda anterior: `insightlab-one-onda10-repaginacao-scrollbar-usuarios.md` (correção do bug real de scrollbar da onda9, módulo de Usuários com reativação, visão de Mês na Agenda, clique único na Lista, StatCard/tokens de marca conectados, login repaginado). Onda anterior a essa: `insightlab-one-onda9-agenda-visual-identidade.md` (filtro de profissionais na Agenda, correção de edição pela Lista, identidade visual de fundo nas duas áreas, botões/scrollbar modernos).
**Por que este arquivo existe:** se a sessão do Claude Code, tmux, WSL, VS Code ou Docker cair, este documento tem tudo que você precisa pra retomar sem precisar reconstruir contexto do zero. **Leia isto antes de subir API/frontend manualmente — desde 29/07/2026 eles rodam supervisionados por `systemd --user`, não é mais `pnpm start:dev` direto no terminal.**

---

## 1. Estado exato no momento em que este guia foi escrito

- **Branch ativa:** `onda-2/backend-crud-completo`
- **Working tree:** limpa — tudo da onda8 já commitado (ver seção 4).
- **`main` local e `origin/main` (GitHub):** sincronizadas, ambas em `e5b27d9` (30/07/2026) — histórico completo publicado em `b5df4ab` (push com `--force-with-lease`, autorizado por Renato pois o `origin/main` antigo era um recorte de 6 commits sem ancestral comum com o histórico real); desde então, `onda-2/backend-crud-completo` seguiu pra `main` via PR (#1) mergeado por fast-forward (`git merge --ff-only`), a pedido explícito de Renato. Credencial Git configurada em `.git/credentials` (arquivo local do repositório, fora do controle de versão, permissão 600) — push e chamadas à API do GitHub (abrir PR, comentar) deste workspace autenticam sozinhas, sem precisar pedir token de novo. **Nota de plataforma:** GitHub bloqueia auto-aprovação de PR pelo próprio autor (`"Can Not approve your own pull request"`) — quando pedido pra "aprovar" um PR aberto por este workspace, o review sai como comentário com veredito, não como approval formal; a decisão de mergear continua sendo de Renato. **Push e merge pra `main` continuam Zona Vermelha** — ter credencial funcionando não dispensa aprovação explícita de Renato a cada push/merge real.

### O que já está rodando (nesta máquina, agora) — via systemd, não mais processo solto
| Serviço | Como está rodando | Porta | Observação |
|---|---|---|---|
| Postgres (dev real) | Docker, `insightlab_one_postgres` | 5433 | `restart: unless-stopped`. **Se a API não conectar mesmo com o container "Up", veja seção 2.1 — é um bug conhecido do proxy de porta WSL2↔Docker Desktop, não falta de container.** |
| Redis | Docker, `insightlab_one_redis` | 6379 | mesmo padrão acima |
| API NestJS | **`systemd --user` — `insightlab-api.service`**, roda a build de produção (`dist/src/main.js`), com `Restart=always` | 4000 | Sobrevive a crash sozinho. Ver seção 2.2 pra comandos de gestão. |
| Frontend Next.js | **`systemd --user` — `insightlab-web.service`**, roda `pnpm start` (build de produção) | 3000 | Mesmo padrão acima |

**Mudança de código não aparece sozinha nesses dois serviços** (eles rodam build, não watch) — depois de editar código, rode `pnpm build` na pasta certa e `systemctl --user restart insightlab-api` (ou `insightlab-web`). Pra desenvolvimento ativo com hot-reload, pare o serviço systemd correspondente (`systemctl --user stop insightlab-api`) e rode `pnpm start:dev`/`pnpm dev` manualmente no terminal como sempre — só lembre de religar o serviço systemd depois, ou a próxima queda não vai se auto-recuperar.

---

## 2. Checklist de diagnóstico rápido (Zona Verde — sempre seguro rodar)

```bash
cd ~/projects/insightlab-one/workspace

git status
git branch --show-current
git log --oneline -5

docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

systemctl --user status insightlab-api insightlab-web --no-pager

curl -s -o /dev/null -w "API: %{http_code}\n" http://localhost:4000/
curl -s -o /dev/null -w "Web: %{http_code}\n" http://localhost:3000/
```

Se a branch não for `onda-2/backend-crud-completo`, rode `git checkout onda-2/backend-crud-completo`.

### 2.1 Se a API não conecta no banco mesmo com Postgres "Up"
Isso já aconteceu de verdade nesta sessão (29/07/2026) — três vezes seguidas, com o container mostrando "Up" e `pg_isready` OK. Causa real: o **proxy de porta do Docker Desktop↔WSL2 aceita o handshake TCP sem repassar os dados pro container** — `pg_isready` via `docker exec` não pega isso porque testa o socket Unix interno, não a porta publicada. Sintoma: `docker logs insightlab_one_postgres --since 3m` fica **vazio** mesmo com a API tentando conectar.

```bash
docker logs insightlab_one_postgres --since 3m   # vazio = confirma o proxy quebrado
docker restart insightlab_one_postgres           # corrige na prática
docker restart insightlab_one_redis              # por precaução, mesmo padrão
systemctl --user restart insightlab-api          # o Restart=always eventualmente pegaria sozinho, mas isso é mais rápido
```

Detalhe completo do diagnóstico em `governance/insightlab-one-onda6-correcoes-resiliencia-whitelabel.md` seção 4.

### 2.2 Se uma migration falhar com "must be owner of table" (P3018) ou "permission denied to create database" (P3014)

Achado em 30/07/2026: a credencial que a API usa em runtime (`insightlab_app`, no `DATABASE_URL` do `.env`) **não tem privilégio de DDL** — só o dono das tabelas (`insightlab`) pode rodar `ALTER TABLE`/`CREATE DATABASE`. Isso é proposital (privilégio mínimo em runtime), mas quebra `prisma migrate dev`/`deploy` direto. Workaround até isso virar um fluxo formal:

```bash
cd services/api
# 1. Editar prisma/schema.prisma normalmente.
# 2. Criar a pasta de migration manualmente (sem depender do shadow DB):
mkdir -p "prisma/migrations/$(date +%Y%m%d%H%M%S)_nome_da_mudanca"
# 3. Escrever o SQL (ALTER TABLE etc.) em migration.sql dentro dessa pasta.
# 4. Aplicar como o usuário dono, nao via prisma migrate deploy:
docker exec -i insightlab_one_postgres psql -U insightlab -d insightlab_one < prisma/migrations/<pasta>/migration.sql
# 5. Marcar como aplicada no controle do Prisma:
npx prisma migrate resolve --applied <nome_da_pasta>
# 6. Regenerar o client:
npx prisma generate
```

### 2.3 Comandos de gestão dos serviços systemd
```bash
systemctl --user status insightlab-api insightlab-web    # estado atual
systemctl --user restart insightlab-api insightlab-web   # depois de pnpm build
journalctl --user -u insightlab-api -n 50                # log via journal
tail -f ~/projects/insightlab-one/workspace/.run/api.log # log direto (mesmo conteúdo)
```

---

## 3. Como subir cada peça do zero (se `systemctl --user status` mostrar `inactive`/`failed`, ou numa máquina nova)

### 3.1 Docker (Postgres + Redis)
```bash
cd ~/projects/insightlab-one/workspace/infra/docker
docker compose up -d
```
Seguro rodar mesmo com os containers já de pé. `postgres_data` é um volume **externo** com os dados reais.

### 3.2 Registrar os serviços systemd (só necessário numa máquina/usuário novo — nesta máquina já está feito)
```bash
mkdir -p ~/.config/systemd/user
# copiar insightlab-api.service e insightlab-web.service pra ~/.config/systemd/user/
# (conteúdo completo documentado em governance/insightlab-one-onda6-correcoes-resiliencia-whitelabel.md seção 4.3)
loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable --now insightlab-api insightlab-web
```

### 3.3 Build manual (se mudou código e quer atualizar os serviços)
```bash
cd ~/projects/insightlab-one/workspace/services/api && pnpm build
cd ~/projects/insightlab-one/workspace/apps/web && pnpm build
systemctl --user restart insightlab-api insightlab-web
```

### 3.4 Modo dev com hot-reload (pra codar ativamente, não pra deixar sempre-ativo)
```bash
systemctl --user stop insightlab-api    # evita conflito de porta 4000
cd ~/projects/insightlab-one/workspace/services/api && pnpm start:dev

systemctl --user stop insightlab-web    # evita conflito de porta 3000
cd ~/projects/insightlab-one/workspace/apps/web && pnpm dev
```
**Lembre de `systemctl --user start insightlab-api insightlab-web` ao terminar**, senão a resiliência sempre-ativa fica desligada até a próxima sessão perceber.

### 3.5 Login pra testar manualmente
- URL: `http://localhost:3000/login`
- Admin (seed): `admin@mix-demo.local` / `Admin@12345`
- Gerente (seed, 29/07/2026 — tudo exceto dado crítico do sistema): `gerente.demo@mix-demo.local` / `Gerente@12345`
- Recepção (seed, 29/07/2026 — balcão: agenda/venda/pagamento/caixa): `recepcao.demo@mix-demo.local` / `Recepcao@12345`
- Operador restrito (seed, permissões mínimas): `operador.restrito@mix-demo.local` / `Operador@12345`
- Profissional vinculado (seed, pra testar isolamento de "Minhas Comissões"): `profissional.demo.login@mix-demo.local` / `Profissional@12345`

**Nota:** durante a validação da onda8 (adendo, 30/07/2026), a conta `admin@mix-demo.local` recebeu nome social "Renato" (aparece como "Seja bem-vindo, Renato" no header) e o profissional de teste "Profissional Teste 1" recebeu nome social "Pri" — dado de demonstração da funcionalidade, ajustável a qualquer momento pela própria tela (Configurações → Usuários / Profissionais → Editar).

---

## 4. O que foi entregue (29-30/07/2026)

Quatro rodadas na mesma sessão — detalhe completo em `insightlab-one-onda6-correcoes-resiliencia-whitelabel.md`, `insightlab-one-onda7-whitelabel-rbac-inteligencia-seguranca.md`, `insightlab-one-onda8-relatorios-auditoria-fotos-header.md` e `insightlab-one-onda9-agenda-visual-identidade.md`. Resumo:

**Onda 6:**
1. **CRUD de verdade fechado** — Clientes, Serviços (edição geral), Produtos, Usuários e Papéis ganharam UI de editar/criar que nunca tinha sido implementada.
2. **3 bugs corrigidos:** hydration mismatch na Agenda, erro 403 cru, duração do agendamento não ajustando ao trocar serviço.
3. **Resiliência de processo** — API e frontend rodam via `systemd --user` com `Restart=always`. Ver seção 1 e 2 acima.
4. **White-label — primeira aplicação real do InsightLab.**

**Onda 7:**
5. **Segurança** — `pnpm audit`: 8 `high` → 0 (17 achados → 6, ver `DECISAO_RISCO_ACEITO_NESTJS_CORE_SSE.md` pro único não corrigido, confirmado por Renato em 30/07).
6. **White-label do Mix Concept Hair** — paleta (dourado/preto/creme) aplicada na área operacional.
7. **RBAC** — papéis Gerente e Recepção, seguindo padrão de mercado (Vagaro). Credenciais na seção 3.5.
8. **Painel → "Inteligência de Receita"** — gráficos (Recharts), exportação CSV, atualização automática via revalidação + refresh no foco.
9. **Confirmação de ações destrutivas** — cancelar venda, bloquear usuário, cancelar comissão agora pedem confirmação (`AlertDialog`).

**Onda 8:**
10. **Upload de foto/logo, do zero** — disco local (`services/api/uploads/`), endpoints por entidade (profissional/cliente/produto/tenant).
11. **Logo por tenant virou regra geral e data-driven** — `Tenant.logoUrl`, upload pelo Admin em Configurações. Resolve a pendência que estava aberta no `CLAUDE.md`; não precisa mais salvar arquivo manualmente.
12. **Trilha de auditoria com leitura** — `/auditoria`, liberada agora pro Gerente (`audit.read`).
13. **Módulo de Relatórios (`/relatorios`)** — 5 relatórios com filtro de período real e export CSV, permissão customizável por papel via checklist em Configurações → Papéis (escopo travado em `reports.*`, testado contra abuso).
14. **Menu de usuário no header** — "Seja bem-vindo, {nome}" + papel + logout, todo perfil incluindo Admin.
15. **Fotos em cadastros** — profissional/cliente/produto, avatar reaproveitado em listas e seletores (agendamento, venda, comissões).
16. **Nome social** — Usuário/Profissional/Cliente podem ter nome social, exibido como nome principal em toda a tela (header, listas, seletores) quando preenchido; nome de registro continua intacto.
17. **Bug de UI corrigido** — texto "InsightLab One" quebrando durante transição do toggle da sidebar; mobile (375-390px) validado no shell de navegação e nas telas novas desta sessão.

**Onda 9:**
18. **Filtro de profissionais na Agenda** — dropdown com checkbox, todos visíveis por padrão.
19. **Edição de agendamento pela Lista, corrigida** — a visão Lista nunca teve botão de editar; agora tem, reaproveitando o mesmo diálogo do Calendário. Agendamentos travados por status mostram tooltip explicando o motivo, em vez de sumir silenciosamente.
20. **Identidade visual de fundo** — marca d'água sutil (ícones do lucide-react, 5-8% opacidade) na área operacional (Mix: tesoura/brilho dourado) e na sidebar (InsightLab: grafo de dados), decisão registrada de não usar banco de imagens.
21. **Botões e scrollbar modernizados** — hover com elevação/sombra nas variantes principais, scrollbar fina dourada na área operacional.

**Pós-onda 9 (30/07/2026):**
22. **Backlog pós-piloto atualizado** — "Apps mobile" e "Marketplace de descoberta de salão" viraram itens próprios e explícitos em `insightlab-one-onda5-backlog-consolidado.md` seção 2.6 (antes dispersos/implícitos). PR #1 aberto e mergeado em `main` por fast-forward.

**Onda 10 (31/07/2026):**
23. **Scrollbar corrigida** — a barra dourada da onda9 vazava pra dentro de diálogos/dropdowns/selects (bug real de escopo CSS); agora só a rolagem principal do documento é estilizada.
24. **Tokens de marca conectados** — `--shadow-*`/`--color-success/warning/danger/info`/`--gradient-brand-subtle`, já definidos em `design-tokens/insightlab.tokens.css`, ligados ao `@theme inline` (não estavam antes).
25. **`StatCard`** — novo componente compartilhado (ícone+valor+tendência), primeiro uso nas 4 KPIs do Painel.
26. **Login repaginado** — split-screen com gradiente de marca, logo real, tagline.
27. **Agenda — visão de Mês** — terceiro modo Dia/Semana/Mês, grade com contador por dia, clique no dia leva pro Dia.
28. **Agenda — clique único na Lista abre edição** — `DataTable` ganhou `onRowClick`, mesma regra de status travado do Calendário.
29. **Usuários — reativação + módulo próprio** — `POST /v1/users/:id/unblock` novo no backend, botão "Reativar" no frontend, item "Usuários" próprio no sidebar (`/configuracoes?tab=users`).

**Onda 11 (31/07/2026):**
30. **RBAC do sidebar corrigido** — a maioria dos itens do menu (Vendas, Pagamentos, Caixa, Comissões, Documentos Fiscais, WhatsApp, Configurações) nunca teve gate de permissão; agora usa os mesmos códigos já exigidos pelo backend. Efeito real: Recepção e Profissional deixam de ver itens que já não deveriam (o backend já bloqueava, só o link ficava visível). Papel Profissional ganhou `appointments.read` (antes nem a própria agenda via de verdade).
31. **Identidade visual no widget de agendamento público** — logo real do tenant + acento dourado em `/agendar/[tenantSlug]`, antes 100% genérico.
32. **Banner de LGPD** menos competitivo visualmente (`variant="outline"`).
33. **`StatCard` em Minhas Comissões** — consistência com o Painel.

---

## 5. Pendências conhecidas

1. **`@nestjs/core` (CVE-2026-35515)** — risco aceito e confirmado por Renato, documentado em `DECISAO_RISCO_ACEITO_NESTJS_CORE_SSE.md` (código morto no projeto, correção exige migração de major do framework).
2. **Fluxo formal de migração de schema** — hoje depende do workaround manual da seção 2.2 (a credencial de runtime não tem DDL).
3. **Erro de lint pré-existente em `agenda-calendar.tsx`** (`react-hooks/incompatible-library` via React Compiler) — não introduzido nesta sessão, fora de escopo, reportado pra decisão de Renato.
4. **Sem tag Git formal pro Bloco 27** — administrativo, não bloqueia.
5. **Sem testes de frontend** (`apps/web` sem `*.test.*`) — gap pré-existente.
6. **Decremento de estoque na venda de produtos** (`stockQuantity` nunca é abatido) — gap de inventário, não endereçado.
7. **Backlog de negócio** (apps mobile, superfície do cliente/WhatsApp/Pix, Focus NFe FASE 2, estorno de comissão liberada) — todos bloqueados em decisão de Renato ou conta em fornecedor externo, não em código. Ver `insightlab-one-onda5-backlog-consolidado.md` seção 6.
8. **Deploy pra staging/produção** — Zona Vermelha, aguardando aprovação explícita (push pra `main` no GitHub já feito; deploy de fato é decisão separada).

---

## 6. Fluxo de deploy combinado com Renato (25/07/2026, ainda vigente)

Toda implementação nova vai primeiro pra **staging**, valida com Renato manualmente, só depois vai pra produção. Produção suspensa desde `governance/DECISAO_PRODUCAO_SUSPENSA_PRIORIZAR_STAGING.md` — nada muda essa suspensão sem decisão nova.

- Staging: `insightlab-one-api-staging.onrender.com` (Render + Neon + Upstash)
- Produção: `srv-d9i0ecvaqgkc73c8hof0`, suspensa

---

## 7. Documentos relacionados
- `governance/insightlab-one-onda0-adendo-governanca.md` — plano geral, zonas de autonomia, corte de MVP
- `governance/insightlab-one-onda5-backlog-consolidado.md` — retrato único do backlog de produto (o que fechou, o que está bloqueado em decisão/fornecedor)
- `governance/insightlab-one-onda6-correcoes-resiliencia-whitelabel.md` — CRUD, bugs, resiliência, primeira aplicação de marca
- `governance/insightlab-one-onda7-whitelabel-rbac-inteligencia-seguranca.md` — white-label completo, RBAC, Inteligência de Receita, segurança
- `governance/insightlab-one-onda8-relatorios-auditoria-fotos-header.md` — relatórios customizáveis, auditoria, logo por tenant, fotos, menu de usuário
- `governance/insightlab-one-onda9-agenda-visual-identidade.md` — filtro/edição na Agenda, identidade visual de fundo, botões/scrollbar
- `governance/insightlab-one-onda10-repaginacao-scrollbar-usuarios.md` — correção de scrollbar, módulo de Usuários, visão de Mês, tokens de marca conectados, login repaginado
- `governance/insightlab-one-onda11-auditoria-multipersona.md` — auditoria multi-persona, RBAC do sidebar corrigido, identidade visual no widget público, banner de LGPD, StatCard em Minhas Comissões
- `governance/DECISAO_RISCO_ACEITO_NESTJS_CORE_SSE.md` — por que a vulnerabilidade do `@nestjs/core` foi aceita, não corrigida
- `governance/DECISAO_PRODUCAO_SUSPENSA_PRIORIZAR_STAGING.md` — por que produção está pausada
- `governance/BACKLOG_PRODUTO_E_DIFERENCIACAO.md` — visão de produto/diferenciação de mercado
