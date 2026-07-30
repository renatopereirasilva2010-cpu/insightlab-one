# InsightLab One — Adendo de Governança: ONDA 0 (Retomada Rumo ao MVP)

**Versão:** v1.3 — 23/07/2026 (adicionados CLAUDE.md e .claude/settings.json, seção 12)
**Referência:** Base de Conhecimento do Projeto v1 (20/07/2026), Documento-Mestre V28
**Status:** Proposto por Claude a pedido de Renato — pendente de confirmação e registro formal
**Ponto de partida:** Bloco 27 da R1.8.5 (validação de transições de pagamento)

---

## 1. Por que este adendo existe

A revisão crítica do escopo identificou duas tensões que precisam de decisão registrada antes de qualquer retomada técnica:

1. O escopo total documentado (20+ frentes, de agenda a DevSecOps/go-live) é uma plataforma completa, não um MVP — o que colide com a premissa "nada de MVP fraco."
2. O Documento-Mestre (V28) já incorpora R1.10 e R1.11 no papel, mas a execução real ainda está no Bloco 27 da R1.8.5. Escopo documentado correndo à frente do código implementado.

Este adendo propõe um corte de MVP explícito, um mecanismo pra parar de repetir o descompasso doc-código, e um plano operacional (ONDA 0) pra retomar com segurança.

---

## 2. Corte de MVP proposto

### 2.1 Núcleo do piloto — inegociável
- Agenda, Atendimento, Venda, Checkout
- Pagamentos (máquina de estados em validação agora — Bloco 27)
- Caixa, Comissão de profissionais
- Multi-tenancy real na arquitetura — não é feature que se corta, é premissa, vale mesmo com 1 tenant só

### 2.2 Sequenciável — real, mas não bloqueia o go-live do piloto
- Admin master multi-tenant, tenant health, billing status — fazem mais sentido com 2+ tenants rodando
- Estoque/compras/suprimentos (R1.10) — só entra se Mix Concept Hair depender disso no dia 1
- Planos/add-ons/entitlements — versão mínima governada primeiro, motor completo depois
- Comunicação/automação

### 2.3 Pós-piloto validado
- Migração assistida de outros tenants
- White-label
- DevSecOps/qualidade formal completa (R1.11 no escopo pleno — ver seção 7 pra higiene mínima que roda desde já)
- Rollout em escala, hardening

*(Decisão de Renato: confirmar, ajustar ou vetar este corte antes de seguir.)*

**Atualização 30/07/2026:** apps mobile e marketplace de descoberta de salão adicionados explicitamente ao pós-piloto, a pedido de Renato. Lista completa e detalhada agora vive em `insightlab-one-onda5-backlog-consolidado.md` seção 2.6 (documento que substitui esta seção como retrato corrente do backlog pós-piloto) — mantido aqui como registro histórico do corte original.

---

## 3. Estratégia de ferramenta: Claude Code (local) vs. Cowork

**Claude Code, rodando localmente no WSL2/Ubuntu**, é a ferramenta certa pra retomar o Bloco 27 e o núcleo do MVP. O modo Remote Control sincroniza uma sessão de terminal que continua rodando na própria máquina — filesystem, Docker, Postgres local e MCP seguem acessíveis, porque quem processa é a máquina de Renato, não um sandbox remoto. O celular vira janela de acompanhamento/aprovação, não um ambiente à parte.

**Claude Cowork não serve pra esta frente.** Por padrão roda num ambiente isolado nos servidores da Anthropic, só alcançando pasta/navegador locais através do app Desktop — sem acesso a Docker, Postgres ou comando arbitrário no WSL2. Fica reservado pra frentes não-técnicas em paralelo (planilha de planos/add-ons, documentação de governança financeira, textos de comunicação).

*Fontes consultadas em 23/07/2026: documentação oficial do Claude Code (code.claude.com/docs/en/remote-control) e página de produto/central de ajuda do Cowork (anthropic.com/product/claude-cowork, support.claude.com). Remote Control é preview de pesquisa (planos Pro/Max) — confirmar disponibilidade antes de montar o fluxo mobile.*

---

## 4. Três zonas de autonomia

| Zona | Cobre | Autonomia do Claude Code |
|---|---|---|
| 🟢 Verde | Leitura: `git log`/`status`, `docker ps`, `prisma migrate status`, leitura de código e docs | Livre, sem gate |
| 🟡 Amarela | Escrever código/teste numa branch, rascunhar migration (sem aplicar), rodar audit/lint/scans | Livre dentro da branch, revisão assíncrona |
| 🔴 Vermelha | Aplicar migration no banco real, merge pra main/develop, SQL direto, mexer em dado de tenant/pagamento real, deploy | Gate obrigatório — aprovação explícita antes de executar |

Isso não é regra nova — é o mesmo contrato que já existe (SQL só com justificativa+rollback+aprovação; banco/API/core sempre com gate) aplicado à sessão do Claude Code.

---

## 5. ONDA 0 — Diagnóstico e setup

### 5.1 Quando mudar para Claude Code local
- **Agora, para diagnóstico (Zona Verde)** — trabalho de leitura, zero risco, não precisa esperar nada.
- **Depois de revisar os achados e travar o corte de MVP (seção 2)** — pra começar o Bloco 27 propriamente dito (Zona Amarela).
- **Só com aprovação explícita** — pra qualquer ação de Zona Vermelha.

### 5.2 Como abrir a sessão
1. Terminal dentro do WSL2/Ubuntu — nunca PowerShell, nunca Windows Desktop. Via Windows Terminal (perfil Ubuntu) ou terminal integrado do VS Code Remote-WSL.
2. `cd ~/projects/insightlab-one/workspace`
3. Confirmar containers: `docker compose ps` (subir com `docker compose up -d` se preciso)
4. Instalar, se ainda não tiver: `npm install -g @anthropic-ai/claude-code`
5. Rodar `claude` dentro do workspace — a sessão herda o diretório como contexto do projeto.
6. Se ainda não existir, criar um `CLAUDE.md` na raiz do workspace com as regras fixas (as mesmas do `AGENTS.md`: nunca PowerShell, gate de aprovação, formato ONDA|FASE|ETAPA, proibição de inventar terminal) — assim toda sessão nova já carrega o contrato automaticamente.

### 5.3 Primeira instrução pra sessão (Zona Verde — só relatar, não corrigir nada ainda)
```
git status
git log --oneline -15
docker compose ps
npx prisma migrate status
```
Objetivo: confirmar se "Bloco 27 da R1.8.5" ainda bate com a realidade do repositório, ou se algo já avançou sem estar refletido no Documento-Mestre.

### 5.4 Critério de sucesso da ONDA 0
- Estado real do repo/branch/migrations documentado e comparado ao Documento-Mestre V28.
- Corte de MVP (seção 2) confirmado ou ajustado.
- Decisão registrada em `governance/` antes de abrir qualquer proposta ONDA|FASE|ETAPA pro Bloco 27.

### 5.5 Não existe importação automática desta conversa pro Claude Code
Claude Code (CLI, app desktop, web, extensão VS Code) mantém histórico de sessão próprio e separado do chat claude.ai — não existe hoje um jeito nativo de carregar esta conversa dentro dele (inclusive já foi pedido como feature em aberto no repositório do Claude Code, sinal de que não existe). Pra levar o contexto:
1. Baixe este arquivo (e, se quiser, a Base de Conhecimento do Projeto) e salve em `governance/` no seu workspace.
2. Na primeira sessão, rode `/init` — o Claude Code gera um `CLAUDE.md` inicial olhando o código. Edite-o pra incluir as regras fixas e referenciar este arquivo.
3. Na primeira mensagem real, peça: "leia `governance/insightlab-one-onda0-adendo-governanca.md` antes de qualquer coisa." Isso substitui a "importação" — ele lê o resultado consolidado, não precisa reprocessar o histórico do chat.
4. Daqui pra frente, `claude --continue` ou `/resume` mantêm continuidade — mas são sessões do próprio Claude Code, não desta conversa. Fique numa única superfície (recomendado: CLI dentro do WSL2) pra não fragmentar histórico entre CLI, app desktop e web.
5. Auto-memory vem ligado por padrão: depois da primeira sessão bem configurada, o Claude Code começa a anotar padrões e decisões sozinho.

---

## 6. Versionamento — convenção proposta

- **Branch:** `onda-<N>/bloco-<M>-<slug>` (ex.: `onda-1/bloco-27-payment-transitions`) — nome espelha a nomenclatura do Documento-Mestre.
- **Commits:** Conventional Commits (`feat`, `fix`, `test`, `chore`, `docs`) + trailer `Refs: R1.8.5/Bloco-27`.
- **Tags:** ao fechar um bloco, tag `v1.8.5-bloco27` (ou equivalente). Isso é o mecanismo que evita o descompasso doc-código da seção 1: a tag só existe quando o código realmente fecha, então `git tag --list` vira a fonte de verdade de "o que tá implementado de fato" — separado do que tá "incorporado no papel" no Documento-Mestre.
- **Definition of Done por bloco:** testes verdes + `pnpm audit`/`npm audit` sem `high`/`critical` em aberto + `RUN-SUMMARY.md` atualizado + tag criada. Sem isso, o bloco não conta como fechado.

---

## 7. Controles de segurança mínimos (pré-R1.11 formal)

Camada de higiene que roda em paralelo ao núcleo, desde já — não é o programa DevSecOps completo do R1.11 (esse continua sequenciado pra pós-piloto).

1. **Dependências:** `pnpm audit` (ou `npm audit`) antes de cada merge pra main. `high`/`critical` bloqueiam; `moderate`/`low` viram decisão registrada.
2. **Lockfile:** `pnpm-lock.yaml` versionado, instalação com lockfile travado (evita drift silencioso de versão).
3. **Secrets:** confirmar `.env` no `.gitignore`; considerar `gitleaks` ou `detect-secrets` antes de push/PR.
4. **SAST leve:** ESLint com plugin de segurança (`eslint-plugin-security`) ou Semgrep com regras padrão pra Node/NestJS.
5. **Imagens Docker:** scan leve (Trivy ou Grype) nas imagens usadas localmente.
6. **Migrations:** nunca aplicar em ambiente com dado real sem snapshot antes (`pg_dump`) e sem revisão humana do SQL gerado.
7. **LGPD — base técnica (não é parecer jurídico):** campos sensíveis mapeados explicitamente (CPF, dado de pagamento), criptografia em repouso onde fizer sentido, controle de acesso por papel, log de acesso a dado sensível. Validação formal de conformidade pede revisão jurídica/compliance dedicada.

---

## 8. Preparo pra escalar (barato agora, caro depois)

- Toda query/índice já nasce considerando `tenant_id` — não é retrofit.
- Pool de conexões Postgres com limite sensato configurado desde a base.
- Logs estruturados (JSON) com correlação por tenant/request, mesmo antes da stack de observability completa do R1.11.

---

## 9. Checklist consolidado

- [ ] Abrir sessão Claude Code local (seção 5.2)
- [ ] Rodar diagnóstico Zona Verde (seção 5.3)
- [ ] Revisar achados com Renato
- [ ] Confirmar/ajustar corte de MVP (seção 2)
- [ ] Registrar decisão em `governance/`
- [ ] Criar/atualizar `CLAUDE.md` com as regras fixas do projeto
- [ ] Abrir proposta ONDA|FASE|ETAPA pro Bloco 27 (branch conforme seção 6)
- [ ] Rodar controles de segurança mínimos (seção 7) antes do merge
- [ ] Registrar padrão de multi-tenancy (seção 10) — shared schema + tenant_id + RLS ou alternativa justificada
- [ ] Definir alvo de deploy de produção (seção 10)
- [ ] Rodar diagnóstico de bancos Docker (seção 11.1) e classificar cada achado (seção 11.2)
- [ ] Dump de segurança de todo banco antes de qualquer remoção (seção 11.3)
- [ ] Migrar dado de referência pra seed script do Prisma, se aplicável (seção 11.2)
- [ ] Só então considerar ativar Remote Control pra acompanhamento mobile

---

## 10. Revisão de stack (23/07/2026)

**Veredito: mantém.** NestJS + Prisma + PostgreSQL + Jest + REST seguem coerentes e aderentes à finalidade (SaaS multi-tenant com núcleo transacional pesado — pagamento, caixa, comissão). Trocar agora, sem problema técnico concreto, seria reabrir escopo congelado sem evidência objetiva — a mesma regra que vale pra decisão de produto vale pra decisão de arquitetura.

| Peça | Veredito | Por quê |
|---|---|---|
| NestJS | Mantém | Estrutura modular cabe nos vários domínios (agenda, venda, pagamento, estoque...) |
| Prisma | Mantém | Type-safety adequado; o ponto real de atenção não é o ORM, é o padrão de multi-tenancy (ver decisão 1 abaixo) |
| PostgreSQL 16 | Mantém, forte | Garantias ACID são essenciais com pagamento/caixa/comissão no núcleo — sem sinal de que não-relacional serviria melhor |
| REST + Jest | Mantém | Adequados, sem necessidade de troca |
| Kubernetes | **Não agora** | Com 1 tenant piloto, adiciona complexidade operacional (cluster, ingress, RBAC, YAML) sem benefício correspondente — é rollout em escala (seções 2.3/8), não núcleo do piloto |

**Duas decisões a travar agora, sem trocar tecnologia nenhuma:**
1. **Padrão de multi-tenancy** explícito e registrado — sugestão: shared schema + `tenant_id` + row-level security do Postgres (mais barato de operar com 1 tenant, migra bem quando entrar o segundo). Schema-per-tenant ou DB-per-tenant só se isolamento/compliance específico exigir.
2. **Alvo de deploy de produção** — não definido em nenhum documento revisado até aqui. Sugestão pra este estágio: Docker Compose continua servindo o dev; em produção, uma plataforma de container gerenciada simples (Cloud Run, Fargate, Railway, Render ou Fly.io) resolve sem a complexidade operacional do Kubernetes, até o piloto validar e o número de tenants justificar orquestração de verdade.

**Quando revisar stack de verdade:** como architecture runway recorrente — checkpoint curto a cada onda/release fechada, disparado por dor real (throughput caindo, limite técnico batido), nunca como evento aberto de "vamos repensar tudo" no meio de um bloco em andamento.

---

## 11. Higiene de bancos de dados no Docker (23/07/2026)

**Princípio:** qualquer remoção de container, volume ou banco é Zona Vermelha — dump antes, aprovação explícita item por item, sem exceção. Classificação de "o que é cada banco" é julgamento de Renato, não do Claude Code: nem a sessão nem Claude têm histórico de por que cada um foi criado.

### 11.1 Diagnóstico (Zona Verde — roda agora)
```
docker ps -a
docker volume ls
docker system df -v
```
Depois, pra cada instância Postgres ativa:
```
docker exec -it <container> psql -U <user> -c "\l"
```
Atenção: dado Postgres vive no volume, não só no container — um container removido pode deixar volume órfão ainda com dado dentro. `docker volume ls` pega isso; `docker ps -a` sozinho não.

### 11.2 Classificação (requer julgamento humano)
| Categoria | O que é | Destino |
|---|---|---|
| ✅ Declarado/em uso | Está no `docker-compose.yml`, é o dev ativo | Mantém — vira a única fonte de verdade |
| 🧪 Teste | Criado pra rodar suíte de testes | Padroniza em UM banco resetável (`prisma migrate reset` antes de cada run) — nunca vários acumulados |
| 📦 "Canônico"/backup | Cópia guardada "por garantia" | Extrai pra dump de arquivo e, se for dado de referência (não histórico de transação), migra pra seed script do Prisma. Banco original desliga depois |
| ❓ Origem desconhecida | Ninguém lembra por que existe | Dump completo primeiro, sempre. Remove só depois de confirmação explícita |

**O antipadrão real:** "backup" e "canônico" existindo como bancos vivos separados já é a sujeira. Backup é arquivo (`pg_dump`, datado, versionado fora do container). Dado de referência é seed script no git. Um banco "cópia de segurança" que ninguém desliga é dívida técnica, não segurança.

### 11.3 Proposta de execução

**ONDA 0 | FASE — Higiene de Ambiente | ETAPA — Limpeza de Bancos**

**Objetivo:** inventariar, classificar e eliminar bancos/containers/volumes redundantes sem perder nada, com dump prévio de tudo.

**O que será feito:** diagnóstico completo → classificação manual (Renato) → dump de cada banco encontrado → conversão de dado de referência em seed → remoção do confirmado redundante, um item por vez.

**O que não será feito:** nenhuma remoção sem dump prévio confirmado e aprovação explícita item a item; nenhuma suposição sobre o que é descartável.

**Riscos:** perda de dado sem dump prévio (mitigado: dump de tudo antes de decidir); volume órfão passando despercebido (mitigado: checar `docker volume ls`, não só `docker ps`); remover algo ainda em uso (mitigado: checar conexões ativas via `pg_stat_activity` antes de remover).

**TERMINAL 1 — Pré-voo:** seção 11.1 (Zona Verde, sem risco).

**TERMINAL 2 — Execução** (dump é Zona Verde; remoção é Zona Vermelha, aprovação item a item):
```
docker exec -it <container> pg_dump -U <user> <database> > backups/<database>_2026-07-23.sql
```

**TERMINAL 3 — Validação:** cada dump restaura sem erro num banco descartável antes de considerar o original removido.

**Critério de sucesso:** sobra 1 banco dev + 1 banco teste, ambos declarados no `docker-compose.yml`; dado de referência vive em seed versionado; nenhum banco "misterioso" restante.

**Se falhar:** não tentar consertar via SQL direto — reportar container, comando exato e erro completo, e parar até nova instrução.

### 11.4 Prevenção — pra não voltar a acontecer
- `docker-compose.yml` é a única fonte de verdade de quais bancos devem existir. Nada fora dele é "oficial."
- Nomenclatura clara e específica: `insightlab_dev`, `insightlab_test` — nunca `postgres`, `test2`, `backup_old`.
- Backup é arquivo datado fora do container — nunca "mais um banco vivo."
- Dado de referência/seed é `prisma/seed.ts` versionado no git, não banco paralelo.
- Banco de teste é descartável por definição — resetado a cada run, nunca acumulado.
- Checkpoint leve a cada onda fechada: `docker system df` + revisão rápida de containers/volumes órfãos.

### 11.5 Modelagem — pontos gerais
*(Revisão fina do schema específico fica pro Claude Code, que tem acesso real ao `schema.prisma` — o que segue são princípios, não uma auditoria do schema real.)*
- `tenant_id` indexado em toda tabela multi-tenant, sem exceção.
- Convenção de nome única e consistente (ex.: camelCase no Prisma mapeado pra snake_case no banco via `@map`/`@@map`) — o que importa é não misturar convenções.
- Migrations são append-only: nunca editar uma migration já aplicada em qualquer ambiente compartilhado; correção vira migration nova.

---

## 12. Arquivos de execução para o Claude Code (23/07/2026)

Dois arquivos complementam este adendo — este aqui é o plano (lido por humano), aqueles são o contrato de execução (lido pela ferramenta):

- **`CLAUDE.md`** (raiz do workspace) — carregado automaticamente pelo Claude Code a cada sessão. Importa este adendo via `@governance/...` e define as 3 zonas de autonomia como regra de execução.
- **`.claude/settings.json`** (dentro do workspace) — regras `allow`/`ask`/`deny` que dão reforço técnico às zonas. **Importante:** `CLAUDE.md` é contrato comportamental — o Claude Code segue por instrução, não por bloqueio técnico. `settings.json` é o que efetivamente impede uma ação sem pergunta. Os dois juntos cobrem tanto "o que ele deve fazer" quanto "o que ele não consegue fazer sem aprovação."
- **Nunca usar `--dangerously-skip-permissions` nesta máquina** — ele ignora toda essa camada de proteção; existe pra sandbox descartável, não pra ambiente com Docker/banco/código reais.
- Regras de `Bash` em `settings.json` são pattern-matching simples — comandos aninhados (ex.: um script que chama `psql` por dentro) podem escapar do padrão. Teste as regras (rode um comando que deveria ser bloqueado e confirme que o Claude Code realmente pergunta) antes de confiar nelas como garantia.
- Conforme este adendo crescer, vale um `/doctor` periódico no Claude Code pra podar o que já foi resolvido — arquivo grande demais reduz a aderência às instruções.

---

*Documento gerado por Claude a pedido de Renato, com base na Base de Conhecimento do Projeto v1 (20/07/2026) e pesquisa nas fontes oficiais da Anthropic em 23/07/2026. Pendente de revisão e confirmação antes de virar decisão registrada.*
