# InsightLab One — ONDA 11: Auditoria multi-persona e correções

**Status:** Executado por Claude Code em 31/07/2026, na branch `onda-2/backend-crud-completo`, a partir do plano aprovado em `~/.claude/plans/cached-sleeping-conway.md`.
**Ponto de partida:** onda10 já implementada e commitada (`2cef89a`), não pushada.

---

## 1. Por que esta onda existe

Depois da onda10, Renato pediu explicitamente uma auditoria: navegar o sistema via Playwright assumindo várias personas (Recepção, Gerente, Dono/Admin, Profissional, Cliente, Analista de UI/UX), levantar um backlog real de melhorias, e só então desenhar um plano — sem executar nada até aprovação. A auditoria foi feita de verdade (login com cada credencial seed, navegação registrada, screenshots), não é uma lista hipotética.

## 2. Achados e correções

### 2.1 Banner de LGPD competindo com CTA primário
`consent-banner.tsx` usava `<Button size="sm">` (variante `default`, roxa desde a onda9) — mesma cor dos botões de ação real da tela, aparecendo em toda navegação até o usuário aceitar. **Corrigido:** `variant="outline"`, sem mexer na lógica de consentimento.

### 2.2 Widget de agendamento público sem identidade visual (achado mais significativo)
`/agendar/[tenantSlug]` renderizava um `Card` genérico, texto puro, sem logo nem cor de marca — a ÚNICA tela que um cliente final de verdade vê, enquanto toda a área operacional já tinha white-label desde a onda7. O endpoint `GET /v1/public/:tenantSlug` nem expunha o `logoUrl` do tenant.

**Corrigido:**
- Backend: `public-booking.service.ts` `getBusiness()` agora retorna `logoUrl` também (campo já existe em `Tenant`, zero migration). Teste `public-booking.service.spec.ts` atualizado.
- Frontend: `agendar/[tenantSlug]/page.tsx` reaproveita o componente `TenantBadge` já existente (mesma regra "nunca inventa a arte" da decisão de white-label da onda8: logo real ou selo tipográfico, nunca redesenhado) acima do card; acento dourado (`--mix-gold`) na borda do card e no botão "Confirmar agendamento" — mesmo approach hardcoded que a área operacional já usa (só existe 1 tenant real hoje).

### 2.3 `Minhas Comissões` com estilo antigo, inconsistente com o `StatCard` novo
A onda10 criou `StatCard` só pro Painel. `minhas-comissoes/page.tsx` (cards Pendente/Liberado) trocado pro mesmo componente (`Clock`/tone dourado, `CircleCheck`/tone `success`).

### 2.4 RBAC do sidebar não refletia as permissões reais (achado que virou o maior escopo da rodada)
A conta seed do Profissional via quase o mesmo menu que Recepção/Gerente — só "Usuários"/"Auditoria" ficavam escondidos. Investigando, a causa raiz não era a conta de teste: **a maioria dos itens de `navItems` em `app-sidebar.tsx` nunca teve `permission:` configurado**, então qualquer usuário logado via o menu inteiro independente do papel — mesmo Recepção, que segundo a própria descrição do papel no `seed.ts` ("sem comissao, configuracoes...") não deveria ver Comissões/WhatsApp/Configurações. O backend já protegia corretamente cada endpoint (`@RequiredPermissions` em todo `GET` verificado: `sales.read`, `payments.read`, `cash-register.read`, `commissions.read`, `fiscal-documents.read`, `whatsapp.read`, `settings.read`, `attendances.read`, `appointments.read`) — o link ficava visível, mas clicar resultaria em erro/vazio. Não era vazamento de dado real, mas UX quebrada e uma superfície de menu incoerente com o RBAC já decidido.

Perguntado a Renato explicitamente se isso devia ser restringido agora — resposta: **"Restringir já"**.

**Corrigido:**
- `app-sidebar.tsx`: `permission:` adicionado em Agenda (`appointments.read`), Atendimentos (`attendances.read`), Vendas (`sales.read`), Pagamentos (`payments.read`), Caixa (`cash-register.read`), Comissões (`commissions.read`), Documentos Fiscais (`fiscal-documents.read`), WhatsApp (`whatsapp.read`), Configurações (`settings.read`) — todos usando códigos já existentes e já exigidos pelos controllers, nenhuma permissão nova inventada.
- `prisma/seed.ts`: papel Profissional ganhou `appointments.read` (antes só tinha `commissions.read-own`/`commission-payouts.read-own` — nem a própria agenda ele enxergava de verdade no backend). Seed rodado na base de dev (`npx tsx prisma/seed.ts`), confirmado via query direta que a permissão foi concedida.
- Efeito colateral correto, não uma decisão nova: Recepção também parou de ver Comissões/WhatsApp/Configurações no menu — isso já era o comportamento pretendido, documentado no próprio `seed.ts`, só nunca tinha sido aplicado na UI.

### 2.5 Nó de texto órfão "R$ 0" (investigado, não é bug)
Apareceu uma vez na árvore de acessibilidade da tela de login após Painel→logout→login. Reproduzido de novo em navegação limpa: não apareceu. Palpite: resíduo pontual de toast/gráfico numa sequência específica de ações, não reproduzível, não visível. Nenhuma mudança de código.

---

## 3. Validação

- `tsc --noEmit` limpo (frontend e backend).
- `pnpm build` limpo (frontend e backend, sequencial — mesma lição da onda10 sobre não rodar builds pesados em paralelo nesta máquina).
- Suíte Jest completa do backend: 36 suites, 273 testes, incluindo `public-booking.service.spec.ts` com o novo campo `logoUrl`.
- Playwright: `/agendar/mix-demo` deslogado mostrando logo real + acento dourado; login como Profissional confirmando sidebar restrito (só Agenda, Minhas Comissões, Cadastros sem gate, LGPD, Ajuda — nada de Vendas/Pagamentos/Caixa/Comissões/Documentos Fiscais/WhatsApp/Configurações); banner de LGPD com botão `outline`; `Minhas Comissões` com `StatCard`. Zero erro de console.
- Mesmo crash transiente de connection-pool do Prisma logo após restart do serviço (por causa da suíte Jest ter acabado de rodar contra o mesmo Postgres) — recuperado sozinho pelo `Restart=always`, sem intervenção, igual à onda10.

## 4. O que fica fora desta rodada

- "Inteligência de Receita" (Painel) continua sem gate de permissão pro Profissional — não fazia parte dos achados aprovados, registrar como possível próximo achado, não decidido agora.
- Qualquer novo redesenho do widget público além da camada de identidade visual (logo/cor).

---

*Documento gerado por Claude Code a pedido de Renato, a partir do plano aprovado nesta sessão, em 31/07/2026.*
