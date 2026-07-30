# Guia de Retomada de Sessão — InsightLab One

**Última atualização:** 29/07/2026, ao fechar `insightlab-one-onda7-whitelabel-rbac-inteligencia-seguranca.md` (white-label completo, papéis Gerente/Recepção, Painel virou "Inteligência de Receita" com gráficos/exportação, 8 vulnerabilidades `high` corrigidas). Onda anterior: `insightlab-one-onda6-correcoes-resiliencia-whitelabel.md` (CRUD, resiliência via systemd, primeira aplicação de marca).
**Por que este arquivo existe:** se a sessão do Claude Code, tmux, WSL, VS Code ou Docker cair, este documento tem tudo que você precisa pra retomar sem precisar reconstruir contexto do zero. **Leia isto antes de subir API/frontend manualmente — desde 29/07/2026 eles rodam supervisionados por `systemd --user`, não é mais `pnpm start:dev` direto no terminal.**

---

## 1. Estado exato no momento em que este guia foi escrito

- **Branch ativa:** `onda-2/backend-crud-completo`
- **Working tree:** com mudanças **não commitadas** desta sessão (29/07) — ver seção 4. Commit pendente de execução (Zona Amarela, sem push/merge); push/merge continuam Zona Vermelha.
- **`main`:** não tocado nesta sessão.

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

### 2.2 Comandos de gestão dos serviços systemd
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

---

## 4. O que foi entregue nesta sessão (29/07/2026)

Duas rodadas na mesma sessão — detalhe completo em `insightlab-one-onda6-correcoes-resiliencia-whitelabel.md` e `insightlab-one-onda7-whitelabel-rbac-inteligencia-seguranca.md`. Resumo:

**Onda 6:**
1. **CRUD de verdade fechado** — Clientes, Serviços (edição geral), Produtos, Usuários e Papéis ganharam UI de editar/criar que nunca tinha sido implementada.
2. **3 bugs corrigidos:** hydration mismatch na Agenda, erro 403 cru, duração do agendamento não ajustando ao trocar serviço.
3. **Resiliência de processo** — API e frontend rodam via `systemd --user` com `Restart=always`. Ver seção 1 e 2 acima.
4. **White-label — primeira aplicação real do InsightLab.**

**Onda 7:**
5. **Segurança** — `pnpm audit`: 8 `high` → 0 (17 achados → 6, ver `DECISAO_RISCO_ACEITO_NESTJS_CORE_SSE.md` pro único não corrigido).
6. **White-label do Mix Concept Hair** — paleta (dourado/preto/creme) aplicada na área operacional; logo real ainda pendente (Renato precisa salvar o arquivo em `apps/web/public/brand/mix-concept-hair-logo.png`).
7. **RBAC** — papéis Gerente e Recepção, seguindo padrão de mercado (Vagaro). Credenciais na seção 3.5.
8. **Painel → "Inteligência de Receita"** — gráficos (Recharts), exportação CSV, atualização automática via revalidação + refresh no foco.
9. **Confirmação de ações destrutivas** — cancelar venda, bloquear usuário, cancelar comissão agora pedem confirmação (`AlertDialog`).

---

## 5. Pendências conhecidas

1. **Logo real do Mix Concept Hair** — Renato precisa salvar em `apps/web/public/brand/mix-concept-hair-logo.png`; o app já usa automaticamente assim que existir.
2. **`@nestjs/core` (CVE-2026-35515)** — risco aceito, documentado em `DECISAO_RISCO_ACEITO_NESTJS_CORE_SSE.md` (código morto no projeto, correção exige migração de major do framework).
3. **Sem tag Git formal pro Bloco 27** — administrativo, não bloqueia.
4. **Sem testes de frontend** (`apps/web` sem `*.test.*`) — gap pré-existente.
5. **Decremento de estoque na venda de produtos** (`stockQuantity` nunca é abatido) — gap de inventário, não endereçado.
6. **Backlog de negócio** (apps mobile, superfície do cliente/WhatsApp/Pix, Focus NFe FASE 2, estorno de comissão liberada) — todos bloqueados em decisão de Renato ou conta em fornecedor externo, não em código. Ver `insightlab-one-onda5-backlog-consolidado.md` seção 6.
7. **Merge de qualquer branch pra `main` e qualquer deploy** — Zona Vermelha, aguardando aprovação explícita.

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
- `governance/DECISAO_RISCO_ACEITO_NESTJS_CORE_SSE.md` — por que a vulnerabilidade do `@nestjs/core` foi aceita, não corrigida
- `governance/DECISAO_PRODUCAO_SUSPENSA_PRIORIZAR_STAGING.md` — por que produção está pausada
- `governance/BACKLOG_PRODUTO_E_DIFERENCIACAO.md` — visão de produto/diferenciação de mercado
