# InsightLab One — ONDA 6: Correções de QA, Resiliência de Processo e White-Label

**Status:** Executado por Claude Code em 29/07/2026, na branch `onda-2/backend-crud-completo`. Commit pendente de aprovação pra push/merge (Zona Vermelha).
**Ponto de partida:** smoke test de sistema (login → fluxo operacional-financeiro completo → widget público) realizado nesta mesma sessão, que encontrou os achados corrigidos abaixo.

---

## 1. Por que esta onda existe

Uma rodada de smoke test via Playwright (login, agenda, fluxo operacional-financeiro ponta a ponta, extrato de comissão por profissional, widget público de agendamento) encontrou um problema estrutural real: `insightlab-one-onda5-backlog-consolidado.md` registrava "CRUD completo (clientes, profissionais, serviços, produtos, usuários, papéis, configurações) — Backend + Frontend — Fechado 26/07/2026", mas o teste ao vivo mostrou que **apenas Profissionais e Configurações tinham a UI de edição de fato ligada no frontend**. Clientes, Serviços (edição geral), Produtos, Usuários e Papéis nunca tiveram botão de editar/criar implementado, apesar do backend ter os endpoints desde 26/07. Isso confirma exatamente o tipo de risco que a seção "Um quarto tipo" do `CLAUDE.md` descreve — resumo mais novo dizendo "fechado" quando o estado real era outro.

Corrigido nesta onda, junto com 3 bugs menores encontrados no mesmo teste, um problema real de resiliência de processo descoberto ao vivo, e a primeira aplicação real da identidade visual do InsightLab (branding até então só existia como arquivo, nunca aplicado ao app).

---

## 2. Correções de CRUD (fecha a lacuna real do onda5)

Implementado UI de edição/criação, seguindo o padrão já estabelecido (`EntityDialog` + formulário reaproveitado create/edit), para:

- **Clientes** — `EditClientButton` + `updateClient` action, PATCH `/v1/clients/:id`.
- **Serviços** — `EditServiceButton` (nome/descrição/duração/preço/disponibilidade online) via PATCH `/v1/services-catalog/:id`, mantendo o botão "Fiscal" já existente separado (CNAE/ISS/item de lista, que o endpoint geral não aceita).
- **Produtos** — `EditProductButton` + `updateProduct` action, PATCH `/v1/products/:id`.
- **Usuários** (dentro de Configurações → aba Usuários) — criação (`POST /v1/users`), edição de nome/telefone (`PATCH /v1/users/:id`), bloqueio (`POST /v1/users/:id/block`).
- **Papéis** (Configurações → aba Papéis) — criação de papel (`POST /v1/roles`), atribuição de permissão (`POST /v1/roles/:id/permissions`) e de usuário (`POST /v1/roles/:id/users`) via um diálogo "Gerenciar" por papel.

Validado: `tsc --noEmit` limpo (frontend e backend), suíte Jest completa (34 suítes / 246 testes, verde), e confirmado visualmente via Playwright (botão de editar aparece, `pnpm build` de produção sem erros).

---

## 3. Bugs corrigidos

1. **Hydration mismatch no calendário da Agenda** — a linha indicadora de "hora atual" calculava `new Date()` durante o render (`agenda-calendar.tsx`), gerando posições diferentes entre servidor e cliente. Corrigido: `now` vira `useState<Date|null>(null)` + `useEffect`, só populado depois do mount (atualiza a cada 60s).
2. **Erro 403 cru ("Forbidden resource")** — `PermissionGuard` (`services/api/src/common/guards/permission.guard.ts`) retornava `false` em vez de lançar uma exceção estruturada, então o NestJS usava a mensagem padrão genérica, ignorando o `HttpExceptionFilter` que todo o resto da API usa (`code`/`title`/`message`/`recommendedAction`). Corrigido: guard agora lança `ForbiddenException` com payload estruturado. Contraria diretamente o princípio de UX já documentado (`BACKLOG_PRODUTO_E_DIFERENCIACAO.md` seção 5: "nunca erro cru, sempre mensagem humana"). `permission.guard.spec.ts` atualizado para refletir o novo comportamento (antes: `toBe(false)`; agora: `toThrow(ForbiddenException)` + teste novo garantindo que a mensagem não é mais a genérica).
3. **Duração do agendamento não ajustava ao trocar serviço manualmente** — só corrigia ao clicar numa sugestão de horário. `appointment-form.tsx`: `handleServiceChange` agora recalcula o término com base na duração do novo serviço sempre que o campo Serviço muda.

---

## 4. Resiliência de processo — achado real durante esta sessão

### 4.1 O que estava acontecendo
A API e o frontend, rodando via `pnpm start:dev`/`pnpm dev` direto no processo (sem supervisão), morriam sempre que a máquina caía (fechamento do Windows, WSL reiniciando) e não voltavam sozinhos — exigindo religar manualmente a cada nova sessão. Isso já estava documentado como rotina esperada no `GUIA_RETOMADA_SESSAO.md`.

### 4.2 Causa raiz encontrada ao vivo (não é só "a máquina desligou")
Durante esta sessão, a API caiu **três vezes seguidas** com `PrismaClientInitializationError: Can't reach database server at localhost:5433`, mesmo com Postgres aparentemente saudável (`docker ps` mostrando "Up", `pg_isready` OK). Diagnóstico:

- `pg_isready` rodado via `docker exec` testa o **socket Unix dentro do container** — nunca testa a porta TCP publicada (5433) que a aplicação realmente usa. Não prova que o proxy de porta está saudável.
- Um teste de conexão TCP crua (`node -e "net.createConnection(...)"`) **conectava com sucesso** (handshake de 3 vias completo) — mas o Postgres nunca via a conexão chegar (`docker logs` sem nenhum registro de conexão nova).
- Conclusão: o **proxy de porta do Docker Desktop↔WSL2 estava aceitando o handshake TCP localmente sem repassar os dados pro container** — um bug de rede já conhecido dessa integração (ver `docker_wsl_integration.md` na memória do Claude Code, registrado antes desta sessão). `docker restart insightlab_one_postgres` resolveu imediatamente (confirmado com teste isolado de `PrismaClient.$connect()` antes/depois do restart).
- **Achado secundário, causado por mim durante o diagnóstico:** cada tentativa manual de religar a API deixava um processo `nest.js start --watch` órfão pra trás (o `pkill -f "nest start --watch"` não casava com o nome real do processo, `nest.js start --watch`, por causa do `.js`). Três órfãos acumulados consumiram ~1.2GB de RAM numa VM WSL2 de 3.8GB, causando swap e piorando os sintomas. Limpo via `kill -9` nos PIDs certos.

### 4.3 Solução implementada: `systemd --user`
Confirmado que este WSL2 já roda `systemd` como init (PID 1) — não precisa de nenhuma configuração adicional de sistema. Criados dois serviços:

- `~/.config/systemd/user/insightlab-api.service`
- `~/.config/systemd/user/insightlab-web.service`

**Decisão de design importante:** os serviços rodam a build de produção (`node dist/src/main.js` / `pnpm start` com `next build` prévio), **não** `pnpm start:dev`/`pnpm dev`. Motivo: em modo watch, quando o processo filho (o app de verdade) morre por um erro fatal, o processo pai (o watcher do `nest`/`next`) **continua vivo** esperando mudança de arquivo — o systemd nunca detecta a queda porque o PID que ele supervisiona nunca sai. Rodando a build direto, qualquer crash fatal derruba o processo inteiro, e `Restart=always` entra em ação de verdade. **Custo assumido:** mudança de código não aparece automaticamente nos serviços — precisa `pnpm build` + `systemctl --user restart insightlab-api insightlab-web`. Pra desenvolvimento ativo (como esta própria sessão), usar `pnpm start:dev`/`pnpm dev` manualmente continua sendo o fluxo certo; os serviços systemd são a *baseline sempre-ativa* pro aplicativo existir mesmo sem ninguém codando.

Outras proteções:
- `loginctl enable-linger renato` — os serviços sobrevivem sem sessão de login ativa (relevante se o WSL subir sem alguém logar interativamente).
- `StartLimitIntervalSec=60` / `StartLimitBurst=5` — trava de segurança pra não repetir o problema da seção 4.2 (loop de restart autoalimentado); se cair 5x em 60s, o systemd para de tentar em vez de martelar a VM indefinidamente.
- Logs em `.run/api.log` e `.run/web.log` (gitignored).

**Validado ao vivo:** `kill -9` forçado no processo da API duas vezes, em ambos os casos o systemd religou sozinho em poucos segundos, sem intervenção.

### 4.4 O que isso NÃO resolve
- Não impede o Postgres/Redis de cair por causa da instabilidade do Docker Desktop↔WSL2 — só garante que a API/frontend se recuperam automaticamente quando o banco volta (via `Restart=always`), em vez de ficar travado esperando indefinidamente.
- Não cobre o Docker Desktop em si iniciar sozinho quando o Windows liga — isso é configuração do lado Windows ("Start Docker Desktop when you sign in", no app Docker Desktop). Fora do alcance do WSL/Linux.
- Comandos úteis pra depurar isso no futuro, se voltar a acontecer:
  ```bash
  systemctl --user status insightlab-api insightlab-web
  journalctl --user -u insightlab-api -n 50
  docker logs insightlab_one_postgres --since 3m   # vazio = pacote nunca chegou no container = proxy de porta quebrado
  docker restart insightlab_one_postgres            # correção mais provável
  ```

---

## 5. White-label — primeira aplicação real da marca

### 5.1 O que existia antes desta onda
`docs/brand/INSIGHTLAB_BRAND_SYSTEM.md`, `design-tokens/insightlab.tokens.{css,json}` e `apps/web/public/brand/insightlab-logo-original.png` existiam como arquivos desde 28/07/2026, mas **nunca tinham sido importados nem referenciados em nenhum lugar do app** — confirmado por busca (`grep`) sem nenhum resultado. A sidebar usava o tema cinza padrão do shadcn/ui; o texto "InsightLab One" era só texto simples, sem cor nem logo.

### 5.2 O que foi aplicado
Estrutura pedida (esquerdo = InsightLab, direito operacional = tenant) já existia na composição da tela (`AppSidebar` à esquerda com "InsightLab One", header do conteúdo com o nome do tenant) — o que faltava era a identidade visual de verdade:

- **Sidebar** (`app-sidebar.tsx` + `globals.css`): fundo navy (`--insightlab-navy-900`, `#0c235a`), texto em mist claro, item ativo/hover em violeta (`--insightlab-violet-600`, `#5c31d6`), borda em índigo — valores copiados diretamente de `design-tokens/insightlab.tokens.css`, comentado no CSS apontando a fonte. Logo real (`insightlab-logo-original.png`) adicionado no cabeçalho da sidebar, num chip branco (a imagem não tem versão transparente/mono, então precisa de fundo claro pra não quebrar visualmente — lacuna já registrada no `CLAUDE.md` desde 28/07, não resolvida aqui).
- **Ações primárias em todo o app** (botões, foco): cor de ação primária trocada pro violeta oficial (`--color-action-primary` do token file), afetando tanto o lado InsightLab quanto o operacional — decisão deliberada, já que cor de ação é elemento de marca consistente, não territorial.
- **Área operacional (lado "Mix")**: mantida branca/neutra, alinhado com a proporção que o próprio sistema de marca recomenda (70-80% branco/off-white) — e, na prática, é o único caminho responsável agora, ver 5.3.

Verificado visualmente via Playwright (screenshot real, não suposição) em `/painel` e `/clientes`: sidebar navy com logo e item ativo violeta, botão "Novo cliente" violeta, zero erro de console. Um bug real apareceu no caminho e foi corrigido: o `next/image` tentou otimizar a logo e falhou com 400 (`sharp` não está instalado) — resolvido com a prop `unoptimized` no componente, sem adicionar dependência nova.

### 5.3 O que NÃO foi feito — bloqueio real, não escolha
**Não existe nenhum ativo de marca do Mix Concept Hair no repositório** — nenhum logo, nenhuma paleta de cor, nada em `docs/brand/`, `design-tokens/` ou em qualquer lugar do código. O schema do banco (`Tenant`, `Unit`) também não tem nenhum campo pra isso (`logoUrl`, `primaryColor` etc. não existem). Por isso, a área operacional (lado "Mix") ficou estruturalmente pronta pra receber a identidade do tenant, mas **sem nenhuma cor ou logo inventados** — isso contraria diretamente a regra do `CLAUDE.md` ("nunca gerar variante de logo silenciosamente", "reportar lacunas de asset explicitamente"). Este é o item que precisa da sua decisão — ver seção 7 do documento de decisões pendentes desta sessão (comunicado na resposta do chat, não neste arquivo).

---

## 6. Validação final desta onda

- `tsc --noEmit` limpo em `services/api` e `apps/web`.
- `pnpm build` limpo nos dois (produção).
- Suíte Jest do backend: 34 suítes / 246 testes, verde (inclui o `permission.guard.spec.ts` atualizado).
- Smoke visual via Playwright confirmado em Agenda, Painel, Clientes, Serviços, Produtos, Configurações (Usuários/Papéis), widget público — sem erro de console novo.
- API e frontend confirmados sobrevivendo a `kill -9` via systemd, duas vezes.

## 7. O que não foi feito nesta onda (fora de escopo deliberado)
- Nenhum item do backlog pendente listado em `insightlab-one-onda5-backlog-consolidado.md` seção 2/6 foi executado — todos dependem de decisão de negócio ou conta em fornecedor externo (Focus NFe, Asaas, Meta Cloud API, apps mobile), não de código. Ver seção de decisões pendentes na resposta desta sessão.
- Nenhum push nem merge pra `main` — Zona Vermelha, aguardando aprovação explícita.

---

*Documento gerado por Claude Code a pedido de Renato, a partir de um smoke test de sistema e do trabalho de correção que ele motivou, em 29/07/2026.*
