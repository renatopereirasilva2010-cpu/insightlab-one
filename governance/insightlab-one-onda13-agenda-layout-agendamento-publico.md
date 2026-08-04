# InsightLab One — ONDA 13: Correções de layout da Agenda + exposição do agendamento público

**Status:** Executado por Claude Code em 03-04/08/2026, na branch `onda-2/backend-crud-completo`.
**Ponto de partida:** onda12 fechada (import de clientes + reversão/exclusão com integridade).

---

## Contexto

Renato trouxe uma lista grande de pedidos (layout do calendário, horário de funcionamento/feriados, redesenho da aba Disponibilidade, agendamento público, repaginação visual, dashboard em tempo real no Painel, destaque de logo). Dado o tamanho e a heterogeneidade da lista, a sequência combinada foi: primeiro os itens rápidos e contidos (bugs de layout + visibilidade do agendamento público), depois trazer racional/proposta pros itens maiores (horário de funcionamento, feriados, Disponibilidade, redesenho visual amplo) antes de construir. Este documento cobre só a primeira parte.

---

## 1. Calendário — sobreposição do horário na linha do cabeçalho

**Achado:** cada rótulo de hora (`08:00`, `09:00`...) na coluna "Hora" era centralizado verticalmente (`-translate-y-1/2`) exatamente sobre a linha da grade correspondente. Para o primeiro horário, isso fazia metade do texto invadir visualmente a borda inferior do cabeçalho ("Hora" / nome dos profissionais), e para todos os horários o texto ficava cruzando a linha horizontal que atravessa as colunas dos profissionais — visualmente "grudado" na linha, não alinhado limpo acima dela.

**Correção:** removido o `-translate-y-1/2`; o rótulo agora nasce logo abaixo da própria linha (`top: ... + 2px`), sem sobrepor nada. `apps/web/src/app/(dashboard)/agenda-calendar.tsx`.

---

## 2. Calendário — preenchimento de layout não se adequava à quantidade de profissionais

**Achado:** cada coluna de profissional tinha largura fixa (`w-52`, 208px) e `shrink-0`, dentro de um container `min-w-max`. Com poucos profissionais (ex.: 3, caso real do Mix hoje), sobrava mais da metade da tela em branco à direita — confirmado visualmente via screenshot antes da correção.

**Correção:** colunas passaram a `flex-1 min-w-52` (crescem pra preencher o espaço disponível, mas nunca ficam mais estreitas que 208px) e o container pra `min-w-full` (ocupa no mínimo a largura total, mas ainda pode crescer além dela se houver muitos profissionais, disparando o scroll horizontal já existente via `overflow-x-auto`). Com poucos profissionais as colunas se espalham por toda a área; com muitos, voltam ao comportamento de scroll. `apps/web/src/app/(dashboard)/agenda-calendar.tsx`.

**Validado:** screenshot antes/depois comparando os dois estados — confirmado visualmente que ambos os problemas somem.

---

## 3. Agendamento público estava "oculto"

**Achado real (não suposição):** a página `/agendar/[tenantSlug]` (`apps/web/src/app/agendar/[tenantSlug]/page.tsx`) sempre existiu, é completa e funcional — testada ao vivo nesta rodada e renderiza corretamente o formulário de agendamento com a marca do tenant (Mix Concept Hair). O problema real: **nenhum lugar do painel autenticado mostrava esse link pro admin** — nem a sidebar, nem Configurações, nem em lugar nenhum. `Tenant.slug` já existe no schema (`String @unique`) e já era retornado por `GET /v1/tenants` (findAll, não usado pelo painel de config), mas nunca chegava no `GET /v1/auth/me` que alimenta o resto do painel.

**Correção:**
- `services/api/src/modules/auth/auth.service.ts`: `me()` agora inclui `tenant.slug` na resposta.
- `apps/web/src/lib/api-types.ts`: `SessionProfile.tenant` ganhou `slug: string`.
- Novo componente `apps/web/src/app/(dashboard)/configuracoes/public-booking-link-card.tsx` — card com o link completo (`{origin}/agendar/{slug}`), botão "Copiar" (clipboard) e "Abrir" (nova aba). Renderizado em Configurações → Negócio, logo abaixo do upload de logo do tenant, visível pra qualquer usuário com acesso à aba (não é uma ação destrutiva, não precisa de permissão extra além de já estar em Configurações).

**Validado:** teste ao vivo via Playwright — card mostra `http://localhost:3000/agendar/mix-demo` corretamente; clique em "Abrir" abre a página pública real numa nova aba e o formulário de agendamento renderiza completo e funcional (serviço, profissional, data/hora, dados do cliente, consentimento LGPD, botão de confirmar).

---

## 4. Validação técnica

- `tsc --noEmit` limpo (web + api).
- `pnpm build` limpo (web + api) — ambos os builds ficaram bem mais lentos que o normal nesta sessão (13 e ~10 minutos, ao invés de ~2) por causa de pressão severa de recursos no host (load average chegou a 11+, swap quase cheio) — não é regressão de código, é ambiente. Builds em background via `nohup`/`disown` (desacoplados do processo que os disparou) foram necessários pra sobreviver a essa pressão sem serem encerrados prematuramente.
- Suíte completa do backend: 38 suites, 300 testes, verde (incluindo o teste de `auth.service.spec.ts` `me()` atualizado pra cobrir `tenant.slug`).
- Validação visual ao vivo via Playwright para os 3 itens (screenshots comparativos antes/depois do calendário, navegação real até a página pública de agendamento).

---

## 5. O que fica fora desta rodada

- Horário de funcionamento do estabelecimento + feriados (novo parâmetro, precisa de schema novo) — pedido explicitamente para próxima rodada, com racional antes de construir.
- Redesenho da aba Disponibilidade — pedido explicitamente para próxima rodada, com avaliação de conceito/critério antes de construir (não é só mexer na tela).
- Repaginação visual mais ousada, dashboard em tempo real no Painel, destaque de logo (Mix e InsightLab) — mudança visual ampla, que pelo contrato do projeto (`CLAUDE.md`) exige ler o brand system e propor sequência de implementação antes de qualquer mudança.
- Replicar o seletor de cliente pesquisável (onda12, item 6) pra Profissionais/Serviços/Produtos — avaliado e descartado por ora: esses catálogos têm 1 a 3 registros hoje no tenant real, o `Select` simples continua adequado; revisitar só se o volume crescer.

---

*Documento gerado por Claude Code a pedido de Renato, em 03-04/08/2026.*
