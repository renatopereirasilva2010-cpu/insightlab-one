# InsightLab One — ONDA 10: Correção de scrollbar, módulo de Usuários, visão de Mês na Agenda, tokens de marca conectados

**Status:** Executado por Claude Code em 31/07/2026, na branch `onda-2/backend-crud-completo`, a partir do plano aprovado em `~/.claude/plans/cached-sleeping-conway.md`.
**Ponto de partida:** onda9 (identidade visual de fundo, botões, scrollbar) já validada e mergeada em `main`.

---

## 1. Por que esta onda existe

Renato testou o sistema com o resultado da onda9 e reportou que não foi suficiente: (1) a scrollbar dourada da onda9 estava atrapalhando a navegação na maioria das telas em vez de ajudar; (2) não havia um módulo de Usuários com visibilidade própria (existia, mas escondido numa aba dentro de Configurações, sem ação de reativar); (3) faltava filtro de Mês na Agenda; (4) a Lista da Agenda não abria edição ao clicar na linha; e (5) pediu uma repaginação visual mais ampla, usando Trinks/Avec/Beauty Date/AZ Sistemas como benchmark direto — mercado que usa uma linguagem visual mais densa (cards de KPI com ícone/cor, avatares em toda lista) que o "muito clean" atual.

## 2. Decisão de escopo

Repaginar as ~28 telas do dashboard uma por uma numa única rodada foi descartado como arriscado demais pra fazer com qualidade. Em vez disso: (a) refazer os componentes compartilhados (que já mudam o visual do sistema inteiro por construção, já que são usados em quase toda tela), (b) tratamento específico nas telas de maior tráfego (Login, Painel, Agenda, Usuários), (c) passada de validação visual em todas as telas tocadas. Redesenho bespoke de cada tela individual fica fora desta rodada.

## 3. Scrollbar — bug real corrigido

**Achado:** a regra da onda9 (`html { scrollbar-color }` + `::-webkit-scrollbar` sem nenhum seletor) estilizava a barra de rolagem de **qualquer** caixa com overflow no documento inteiro no Chrome/Edge/Safari — incluindo diálogos, dropdowns e selects renderizados em portal (Radix), onde uma barra de 10px dourada ficava desproporcional. Firefox tinha o mesmo problema por outro motivo: `scrollbar-width`/`scrollbar-color` são propriedades herdadas por padrão.

**Correção:** `::-webkit-scrollbar*` agora escopado só ao seletor `html` (rolagem principal do documento), 10px → 8px. Reset explícito de `scrollbar-width`/`scrollbar-color` em `[data-slot="dialog-content"]`, `[data-slot="dropdown-menu-content"]`, `[data-slot="select-content"]` pra cobrir a herança do Firefox. Confirmado via Playwright (`getComputedStyle` num dropdown aberto: `scrollbar-width: auto`, `scrollbar-color: auto`) e visualmente num diálogo de edição.

## 4. Tokens de marca — conjunto rico conectado

`design-tokens/insightlab.tokens.css` já tinha um conjunto de tokens mais completo que a marca aprova (`--shadow-sm/md/lg`, `--color-success/warning/danger/info`, `--gradient-brand-subtle`) que nunca tinha sido ligado ao `@theme inline` de `globals.css`. Conectado agora (com variantes pra `.dark`) — isso é reaproveitar decisão de marca já existente, não inventar cor nova.

## 5. Novo componente: `StatCard`

`components/ui/stat-card.tsx` — ícone + rótulo + valor + tendência opcional + `tone` (dourado Mix / índigo InsightLab / estados semânticos). Primeiro uso: as 4 KPIs do Painel, substituindo `Card`s avulsos sem ícone/cor. `ui/card.tsx` ganhou `shadow-sm` na base (via o token conectado acima).

## 6. Login — repaginado

`login/page.tsx` virou split-screen: painel esquerdo com gradiente de marca, logo real do InsightLab (mesmo arquivo já usado na sidebar, nunca reinventado), grafo de dados (`InsightLabWatermark`, reaproveitado) e tagline "Revenue Recovery Intelligence"; painel direito mantém o `LoginForm` existente, lógica intacta. Em telas estreitas cai pra um painel só (comportamento anterior).

## 7. Agenda — três correções

- **Visão de Mês**: terceiro modo (Dia/Semana/Mês) — grade 6×7, contador de agendamentos por dia (respeitando o filtro de profissionais já existente da onda9), clique num dia muda pro modo Dia naquela data. Testado: navegação, contagem, clique-pra-dia.
- **Clique único na Lista abre edição**: `DataTable` ganhou prop opcional `onRowClick`; linhas da Lista de agendamentos abrem o mesmo diálogo de edição que o botão "Editar" já usava, exceto pra status travado (mesma regra do Calendário). Botão "Editar" continua existindo em paralelo, por acessibilidade.
- Ambos reaproveitam `TERMINAL_STATUSES`, agora exportado de `appointment-row-actions.tsx` em vez de duplicado em 3 lugares.

## 8. Módulo de Usuários — visibilidade própria + reativação

**Backend:** novo `POST /v1/users/:id/unblock` (espelha `block`, sem migration — só flip de status pra `ACTIVE`), mesma permissão `users.block`. Testes novos em `users.service.spec.ts` (273 testes no total agora, antes 271).

**Frontend:** botão "Reativar" em `user-row-actions.tsx` quando status é `BLOCKED`, mesmo padrão de confirmação (`AlertDialog`) do bloqueio. Novo item "Usuários" no sidebar (grupo Cadastros, ícone `UserCog`, atrás de `users.read`) apontando pra `/configuracoes?tab=users` — a página de Configurações passou a ler `searchParams.tab` pra abrir a aba certa direto, sem duplicar o CRUD existente nem criar rota nova.

**Validado end-to-end via Playwright:** bloquear → reativar um usuário de teste, confirmando o status virar "Bloqueado"→"Ativo" na tabela e zero erro de console.

---

## 9. Validação

- `tsc --noEmit` limpo (frontend e backend).
- `pnpm build` limpo (frontend e backend) — refeito em sequência depois que rodar os dois builds + suíte Jest completa em paralelo no background esgotou a memória da máquina (3.8GB total) e o OOM killer matou os três processos; processo órfão de `next build` e um worker ficaram presos segurando o lock do `.next/`, limpos manualmente antes de repetir em sequência.
- Suíte Jest completa do backend: 36 suites, 273 testes, todos passando (2 novos, do `unblock`).
- Playwright: login (visual), scrollbar em dropdown e em diálogo (`getComputedStyle`), Painel (StatCards), Agenda (Mês → clique no dia → Dia; Lista → clique na linha → edição), Usuários (bloquear → reativar, ida e volta), Vendas (avatar-forward nas colunas Cliente/Profissional). Zero erro de console nos fluxos testados.
- Um crash transiente da API logo após o restart do serviço (`PrismaClientInitializationError: Timed out fetching a new connection from the connection pool`) — causado pela suíte Jest ter acabado de rodar contra o mesmo Postgres um instante antes; recuperado sozinho pelo `Restart=always` (systemd) na tentativa seguinte, sem intervenção. Não relacionado a nenhuma mudança desta onda.

## 10. O que fica fora desta rodada

- Redesenho bespoke de layout de cada uma das ~28 telas individualmente (decisão de escopo, seção 2).
- Nova rota `/usuarios` dedicada (reaproveitou `/configuracoes` com deep-link de aba).
- Dark mode redesenhado pra marca (segue com fallback neutro, só os tokens novos de sombra/estado ganharam variante `.dark`).

---

*Documento gerado por Claude Code a pedido de Renato, a partir do plano aprovado nesta sessão, em 31/07/2026.*
