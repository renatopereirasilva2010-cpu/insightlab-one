# InsightLab One — ONDA 7: White-label completo, RBAC, Inteligência de Receita, Segurança

**Status:** Executado por Claude Code em 29/07/2026, na branch `onda-2/backend-crud-completo`, a partir do plano aprovado em `~/.claude/plans/cached-sleeping-conway.md`. Commit pendente de aprovação pra push/merge (Zona Vermelha).
**Ponto de partida:** `insightlab-one-onda6-correcoes-resiliencia-whitelabel.md` (CRUD + resiliência + primeira aplicação de marca).

---

## 1. Por que esta onda existe

Renato pediu, numa única mensagem grande: identidade visual completa do Mix Concept Hair (logo anexado), presença mais forte do InsightLab com apelo de inteligência de dados, o módulo Painel elevado a um diferencial real de "Revenue Recovery Intelligence" com gráficos/exportação/atualização automática, papéis de RBAC (Gerente, Recepção), correção de vulnerabilidades de segurança, e polimento de UI — tudo validado com Playwright. Por ser uma mudança visual ampla, foi conduzida via `EnterPlanMode` (exigência do `CLAUDE.md`), plano aprovado, depois executada em 6 fases sequenciais.

---

## 2. Segurança (Fase F)

`pnpm audit --prod`: **17 achados (8 high/7 moderate/2 low) → 6 (0 high/5 moderate/1 low)** via `pnpm.overrides` em `package.json` raiz (`fast-uri`, `js-yaml`, `sharp`, `postcss`, `body-parser`, depois `qs` e `file-type` — foram pra 3 restantes após instalar o Recharts, que fez o pnpm re-resolver o lockfile). Validado com `tsc --noEmit`, `pnpm build` (backend + frontend) e suíte Jest completa (34 suítes/246 testes) em cada etapa — zero regressão.

**1 achado não corrigido, risco aceito e documentado:** `@nestjs/core` (CVE-2026-35515, injeção em SSE) só tem patch na major 11 do NestJS. Este backend nunca usa `@Sse()`/`SseStream` (confirmado via grep) — código morto não é explorável. Forçar só `@nestjs/core` pra v11 via override, com o resto do ecossistema `@nestjs/*` em v10, quebraria a injeção de dependência do framework. Documentado em `governance/DECISAO_RISCO_ACEITO_NESTJS_CORE_SSE.md`.

Restam 2 achados de baixo risco, ambos transitivos do CLI `shadcn` (dev-only, nunca roda em produção).

---

## 3. White-label (Fases A e B)

### 3.1 InsightLab (lado esquerdo — sidebar)
Os tokens de marca (`design-tokens/insightlab.tokens.css`) e o logo (`public/brand/insightlab-logo-original.png`) existiam desde 28/07 mas nunca tinham sido usados no app (confirmado por grep, zero hits). Agora aplicados: sidebar navy (`#0c235a`) com logo real, item ativo/ações primárias em violeta (`#5c31d6`), rodapé com faixa do gradiente de marca + "Powered by InsightLab" — seguindo a tendência de mercado 2026 pesquisada (inteligência como componente desenhado, não selo/badge chamativo).

### 3.2 Mix Concept Hair (lado direito — área operacional)
**Bloqueio real, não escolha:** o arquivo do logo que Renato anexou no chat não chega ao filesystem por nenhuma ferramenta desta sessão (`~/.claude/uploads/` verificado, sem cópia). Implementado o que é possível sem inventar o logo: paleta extraída visualmente (dourado/bronze `#b08d45`/`#c9a227`, preto `#1a1a1a`, creme `#f4efe2`) aplicada ao fundo, acentos, bordas e cards da área operacional; `components/tenant-badge.tsx` criado com fallback tipográfico (badge "M" + nome em negrito) que troca automaticamente pro logo real assim que `apps/web/public/brand/mix-concept-hair-logo.png` existir — sem precisar tocar em código de novo.

**Pendência real com Renato:** salvar o arquivo do logo nesse caminho.

---

## 4. RBAC — Gerente e Recepção (Fase C)

Pesquisa de mercado (Vagaro: "Access Levels" com tier Admin operacional separado de "Manage/Supervisor"; front-desk como papel à parte é padrão do segmento) confirmou que os 2 papéis pedidos batem com a convenção do setor.

- **GERENTE**: todas as ~85 permissões do catálogo, exceto `admin-master.*`, `tenants.update`, `units.update`, `roles.assign`, `audit.read`, `data-subject-requests.*`. Calculado por exclusão (não lista fixa), então continua correto se novas permissões forem adicionadas depois.
- **RECEPÇÃO**: allowlist de balcão — clientes, agenda, atendimento, venda/checkout, pagamento, caixa, leitura de catálogo/fiscal. Sem comissão, configuração, usuários/papéis.

Seed estende `services/api/prisma/seed.ts` com os 2 papéis + usuários demo (`gerente.demo@mix-demo.local` / `Gerente@12345`, `recepcao.demo@mix-demo.local` / `Recepcao@12345`), mesmo padrão idempotente dos papéis já existentes.

**Achado real corrigido durante o teste:** Recepção tinha esquecido `professionals.read`, causando "—" no nome do profissional em várias telas (Agenda, Inteligência de Receita). Corrigido e reseedado.

**Validado ao vivo:** Gerente lê a lista de Papéis mas não vê botão "Novo papel"/"Gerenciar" (roles.assign bloqueado corretamente); Recepção recebe mensagem humanizada ("Você não tem permissão para ver estes dados") em Comissões, sem crash.

---

## 5. Painel → Inteligência de Receita (Fase D)

O Painel já era, na prática, o módulo de Revenue Recovery Intelligence (faturamento do dia, comissão, caixa, faturamento por profissional/serviço, clientes que sumiram — sinal direto de receita em risco) — só faltava o nome e o tratamento visual.

- Renomeado (nav + `<h1>`) pra "Inteligência de Receita", com subtítulo "Revenue Recovery Intelligence" citando a hierarquia de marca já definida no `CLAUDE.md`.
- **Recharts** adicionado (`components/ui/chart.tsx` é uma versão própria do wrapper padrão do shadcn, já que o CLI do shadcn não foi invocado): gráfico de área da tendência de faturamento dos últimos 14 dias, gráficos de barra pro breakdown por profissional/serviço (complementam as tabelas, não substituem).
- **Exportação CSV** (client-side, sem dependência nova) pro resumo e pros dois breakdowns.
- **Atualização "em tempo real" pragmática**: toda mutação que afeta os indicadores (pagamento marcado como pago, caixa aberto/fechado, comissão gerada, pagamento criado numa venda) agora chama `revalidatePath("/painel")` também. Um `AutoRefreshOnFocus` client-side atualiza a tela sozinha ao voltar o foco pra aba ou a cada 60s — sem WebSocket/SSE (decisão deliberada, ver seção 8).

**Bug real encontrado e corrigido no meio do teste:** o cálculo de tendência agrupava pagamentos por dia usando `toISOString()` (UTC), o que pode jogar um pagamento pro dia errado dado o fuso de Brasília (UTC-3) — corrigido pra usar o mesmo critério de hora local que o card "Faturamento hoje" já usava.

---

## 6. Polimento de UI (Fase E)

- Transição de hover em linha de tabela já existia no componente base do shadcn (`table.tsx`) — confirmado, não duplicado.
- `AlertDialog` (já instalado, nunca usado) aplicado às 3 ações realmente destrutivas e sem confirmação: cancelar venda, bloquear usuário, cancelar comissão. Cada uma com frase específica da consequência real, não um "tem certeza?" genérico.
- Validado ao vivo: diálogo abre, "Voltar" cancela sem efeito colateral (conta de teste confirmada como "Ativo" depois).

---

## 7. Validação final (Fase G)

- `tsc --noEmit` limpo (backend + frontend), `pnpm build` limpo nos dois, suíte Jest completa (34 suítes/246 testes) verde.
- Playwright: login como admin, Gerente e Recepção; navegação completa da Agenda (confirma que a correção de hydration da onda6 continua valendo); Inteligência de Receita com gráficos renderizando e exportação CSV funcionando; fronteira de permissão de Gerente e Recepção testada e confirmada em produção real (não suposição).
- Zero erro de console em qualquer tela testada.

---

## 8. O que fica de fora desta rodada (registrado, não esquecido)
- Exportação em PDF — precisa de lib + layout de relatório dedicados.
- Atualização por WebSocket/SSE de verdade — a revalidação por Server Action + refresh no foco cobre o caso de uso real sem a complexidade/risco de uma infra nova.
- Qualquer papel de RBAC além de Gerente/Recepção.
- Itens de Zona Vermelha que dependem de CNPJ do InsightLab ou conta em fornecedor externo (Focus NFe, Asaas, Meta Cloud API) — confirmados em standby por Renato nesta mesma mensagem.
- Merge pra `main` — commits organizados e limpos, mas o merge de fato exige "sim" explícito com o comando exato, conforme `CLAUDE.md`.

---

*Documento gerado por Claude Code a pedido de Renato, a partir do plano aprovado nesta sessão, em 29-30/07/2026.*
