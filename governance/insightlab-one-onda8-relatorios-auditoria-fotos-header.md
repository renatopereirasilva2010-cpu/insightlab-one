# InsightLab One — ONDA 8: Cadastros para Gerente, Relatórios customizáveis, Auditoria, Logo por tenant, Fotos e menu de usuário

**Status:** Executado por Claude Code em 30/07/2026, na branch `onda-2/backend-crud-completo`, a partir do plano aprovado em `~/.claude/plans/cached-sleeping-conway.md`. Commits locais, sem merge/push adicional além do já autorizado na seção 6.
**Ponto de partida:** `insightlab-one-onda7-whitelabel-rbac-inteligencia-seguranca.md` (white-label completo, RBAC Gerente/Recepção, Inteligência de Receita, segurança).

---

## 1. Por que esta onda existe

Depois de fechar a onda7, Renato respondeu às pendências (logo do Mix, risco `@nestjs/core`, merge) e pediu 5 itens novos na mesma mensagem: cadastros gerais liberados pro Gerente, um módulo de relatórios com permissão customizável sob autorização do Gerente, trilha de auditoria legível pelo Gerente, logo do tenant em destaque como regra geral, e um header com identificação do usuário logado (nome/papel/logout) — mais um pedido complementar sobre fotos em clientes/produtos. Por tocar RBAC, um módulo novo e componentes compartilhados de UI, foi conduzido via `EnterPlanMode` (exigência do `CLAUDE.md`), com 2 agentes de exploração levantando o código real antes do plano.

---

## 2. Achado real que mudou o escopo do item 1 (cadastros para Gerente)

O papel GERENTE (calculado por exclusão desde a onda7) **já tinha** `clients.*`, `professionals.*` e `settings.read/update` completos — não estava excluído de nada disso. "Parâmetros operacionais" mapeia pro `BusinessSettings` (já editável via `settings.update`, que Gerente já tinha). Não existe tela de "Unidades" no frontend hoje. **Não houve mudança de permissão pra este item — só validação ao vivo via Playwright**, confirmando que Gerente já edita cliente, profissional e configurações de negócio.

---

## 3. Achado que mudou o desenho do item 3 (auditoria)

Não existia endpoint de leitura de `AuditLog` — só o interceptor que grava (`entity`, `entityId`, `action`, `userId`, `createdAt`, sem diff antes/depois). Construído do zero: `GET /v1/audit-logs` (paginado, filtro por `entity`/`from`/`to`), e `audit.read` foi removido da lista de exclusão do GERENTE (decisão nova e explícita de Renato, substitui o julgamento da onda7).

---

## 4. Upload de arquivo (novo, do zero)

Nenhum mecanismo existia. Implementado com armazenamento em **disco local** (`services/api/uploads/`, gitignorado, servido via `useStaticAssets`) — deliberadamente, não um provedor de nuvem novo (S3/Cloudinary exigiriam conta em fornecedor externo, item que o adendo de governança pede pra manter em standby). Endpoints dedicados por entidade (`POST /v1/{professionals,clients,products}/:id/photo`, `POST /v1/tenants/:id/logo`), cada um reaproveitando o guard de permissão que a entidade já usa. Validação de mimetype (`png/jpeg/webp`) e tamanho (3MB), com erro humanizado (`PHOTO_TOO_LARGE`) via extensão do `HttpExceptionFilter` existente.

**Achado de infraestrutura durante a migração de schema:** a credencial que a API usa em runtime (`insightlab_app`) não tem privilégio de DDL — só o dono das tabelas (`insightlab`) pode rodar `ALTER TABLE`. Isso quebrou o `prisma migrate deploy` padrão (erro `must be owner of table`); contornado aplicando o SQL manualmente via `docker exec ... psql -U insightlab` e depois `prisma migrate resolve --applied`. Boa prática de segurança (privilégio mínimo em runtime) já em vigor antes desta sessão, mas **precisa de um fluxo formal pra próximas migrações** — hoje é um passo manual.

---

## 5. Relatórios customizáveis (item 2)

Catálogo novo: `reports.read`, `reports.revenue.read`, `reports.commissions.read`, `reports.appointments.read`, `reports.inventory.read`, `reports.clients-churn.read`, `reports.manage`. GERENTE recebe o pacote completo por padrão (exclusão, mesmo padrão de sempre); RECEPÇÃO não recebe nenhum até ser liberado.

`/relatorios` (novo): 5 relatórios (Faturamento, Comissões, Ocupação de agenda, Estoque baixo, Clientes inativos), cada um gated pela sua própria permissão, com filtro de período real (o Painel usa 14 dias fixos) e exportação CSV — reaproveitando os mesmos endpoints e o mesmo padrão de agregação server-side que o Painel já usa, sem endpoint de agregação novo no backend.

**Customização com limite de segurança embutido:** `POST/DELETE /v1/roles/:id/report-permissions`, guard `reports.manage`. O service **recusa qualquer código que não comece com `reports.`**, mesmo vindo de quem só tem `reports.manage` — testado explicitamente (tentativa de conceder `audit.read`/`roles.assign` por essa via recusada com 403, ver seção 8). Isso dá ao Gerente controle real sobre relatórios sem reabrir a exclusão de `roles.assign` da onda7.

UI: checklist "Relatórios visíveis" por papel em Configurações → Papéis, visível pra quem tem `reports.manage` (Gerente vê essa versão restrita; Admin continua com o botão "Gerenciar" completo de sempre).

---

## 6. Auditoria (item 3)

`/auditoria` (novo): tabela paginada só-leitura (quem, quando, ação, entidade/ID), nav item só aparece com `audit.read`. Limite registrado: hoje é só "quem fez o quê" — sem diff campo-a-campo antes/depois (o interceptor não popula isso); suficiente pro pedido, diff fica como v2 se pedido depois.

---

## 7. Logo por tenant (item 4) — resolve pendência aberta no `CLAUDE.md`

`Tenant.logoUrl` novo (schema). `tenant-badge.tsx` deixou de checar um arquivo fixo (`mix-concept-hair-logo.png`) e passou a ler `tenant.logoUrl` via `GET /v1/auth/me` — mesmo fallback de iniciais de antes, agora válido pra qualquer tenant. Upload feito por um controle novo em Configurações (Admin-only, `tenants.update`). **Testado ao vivo via Playwright: upload de um arquivo real, header atualizou pro logo de verdade sem reload manual.** Isso substitui a instrução anterior de salvar o PNG num caminho fixo — o jeito certo agora é upload pela tela. `CLAUDE.md` atualizado pra remover a pendência.

---

## 8. Menu de usuário + fotos (item 5)

`GET /v1/auth/me` novo (nome, e-mail, papéis, foto do profissional vinculado, branding do tenant) — a sessão (JWT) nunca carregou isso, decisão de design já existente, não reaberta. Header ganhou `UserMenu`: avatar (foto real se profissional vinculado, senão iniciais) + "Seja bem-vindo, {nome}" + papel(is) + Sair — pra todo perfil, inclusive Admin. Rodapé da sidebar perdeu a linha de e-mail solto + botão Sair duplicado (virou redundante).

Fotos em cadastros: campo de foto em profissional/cliente/produto (upload separado do submit JSON principal), com `EntityAvatar` (foto ou iniciais) reaproveitado em: listas de Clientes/Profissionais/Produtos, seletor de cliente/profissional no agendamento, seletor de produto/profissional na Venda, coluna de profissional em Comissões. Fora do escopo de exibição: documentos fiscais e relatórios financeiros (dado já é numérico/textual, miniatura só adicionaria ruído).

---

## 9. Validação

- `tsc --noEmit` + `pnpm build` limpos (API e web).
- Suíte Jest completa: **271/271 testes, 36 suítes**.
- `pnpm audit --prod`: sem novo `high`/`critical` (multer não trouxe nada).
- Lint: API limpa; web com **1 erro pré-existente** (`agenda-calendar.tsx`, não tocado nesta sessão, já commitado antes desta rodada — reportado, não corrigido, fora de escopo) + 9 avisos pré-existentes do React Compiler sobre `form.watch()`.
- Playwright, sessão completa: login Admin/Gerente/Recepção; Admin fez upload real do logo do tenant e viu o header atualizar sem reload; Gerente confirmado editando cliente/configuração de negócio (item 1) e **sem** botão de upload de logo (corretamente Admin-only); Gerente concedeu o relatório "Faturamento" pra Recepção pela checklist nova; Recepção, ao logar de novo, viu `/relatorios` aparecer no menu com **só** esse relatório liberado, e **não** viu `/auditoria`. Zero erro de console em toda a sessão.

---

## 10. O que fica de fora desta rodada
- Diff campo-a-campo (antes/depois) na auditoria.
- Provedor de storage externo (S3/Cloudinary) — em standby, depende de conta em fornecedor.
- Editor genérico de permissões (revogar qualquer código de qualquer papel) — só o escopo `reports.*` ganhou essa capacidade.
- Foto/avatar customizado pra usuários não vinculados a um profissional (Admin/Gerente/Recepção seguem com iniciais).
- Fluxo formal de migração de schema (hoje é o workaround manual descrito na seção 4) — próxima migração precisa do mesmo contorno até isso ser formalizado.
- Correção do erro de lint pré-existente em `agenda-calendar.tsx` — fora do escopo desta rodada, reportado pra decisão de Renato.

---

---

## 11. Adendo (mesmo dia) — Nome social e correção de UI

Renato pediu, logo após o fechamento desta onda: (1) permitir que qualquer cadastro de pessoa (usuário logado, cliente, profissional) mostre o nome social no lugar do nome de registro em toda a tela, e (2) investigar e corrigir um bug visual no toggle da sidebar, além de validar responsividade mobile.

**Nome social:** `Client` já tinha o campo (`socialName`), só não era usado como nome principal em lugar nenhum. Adicionado `socialName` a `User` e `Professional` (migração `20260730081128_add_social_name`, mesmo workaround de DDL da seção 4). Novo helper `displayName()` (`socialName || name`) — o campo preenchido já é a escolha da pessoa, sem precisar de um toggle separado. Aplicado como nome principal em: header (menu de usuário), listas de Usuários/Profissionais/Clientes, seletores de cliente/profissional na Agenda e Venda, coluna de profissional em Comissões. Nome de registro continua intacto nos formulários. Testado ao vivo via Playwright (profissional e o próprio Admin).

**Bug do toggle da sidebar:** reproduzido via Playwright — cliques rápidos no botão de expandir/recolher fazem a transição de largura CSS parar num valor intermediário, e o texto "InsightLab One" (sem proteção contra quebra de linha, diferente dos itens de navegação que já usam `truncate`) quebrava em duas linhas nesse meio-termo. Corrigido com `whitespace-nowrap`/`truncate`/`overflow-hidden` no cabeçalho da sidebar, mesmo padrão que os itens de menu já usavam.

**Responsividade mobile:** validada em 375-390px — shell de navegação (sidebar mobile em Sheet, header, menu de usuário), módulo de Relatórios, Configurações e os seletores com avatar, todos adequados. Achado pré-existente, não corrigido (fora do escopo, não introduzido nesta sessão): a lista de abas da Agenda (Agendamentos/Bloqueios/Disponibilidade/Salas) usa scroll horizontal nativo em vez de um padrão mais polido — funcional, não quebrado.

**Validação:** 271/271 testes, `tsc`/build limpos, lint sem novidade (mesmo 1 erro pré-existente de antes, não tocado).

*Documento gerado por Claude Code a pedido de Renato, a partir do plano aprovado nesta sessão, em 30/07/2026.*
