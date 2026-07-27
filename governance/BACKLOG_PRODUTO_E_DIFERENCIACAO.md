# Backlog de Produto Revisado — Rumo a um Produto Diferenciado

**Status:** Proposto por Claude a pedido de Renato — pendente de revisão, ajuste e priorização.
**Data:** 25/07/2026.
**Ponto de partida:** núcleo do MVP com backend completo e frontend com todas as telas do piloto implementadas (branch `onda-2/frontend-mvp-screens`, ver `governance/GUIA_RETOMADA_SESSAO.md`).
**Objetivo deste documento:** não é só listar features. É propor um caminho pra sair de "sistema de gestão funcional" pra "produto que os donos de salão/clínica, profissionais e clientes preferem e recomendam" — com diferencial real no mercado brasileiro de beleza/estética.

---

## 1. Onde estamos de verdade

O núcleo transacional (agenda, atendimento, venda, checkout, pagamento, caixa, comissão, multi-tenancy, RLS, auditoria, documento fiscal) está implementado nos dois lados — backend com máquinas de estado testadas, frontend com telas reais contra a API real. Isso é a fundação certa: rigor de dado financeiro, não é prototipagem solta.

O que falta pra virar produto de verdade, na ordem que este documento propõe:
1. Fechar os buracos de CRUD que o frontend já expôs (edição de cadastro básico).
2. Elevar a UX do que já existe (a tela de Agenda em tabela, por exemplo, não é como ninguém enxerga uma agenda de salão).
3. Abrir uma superfície pro cliente final — hoje o sistema só existe pro operador. Isso é a maior lacuna estratégica.
4. Diferenciais que respondem a dores reais do segmento no Brasil (WhatsApp, Pix, no-show, retenção).

---

## 2. Quem usa isso e o que cada um precisa

| Stakeholder | Dor real hoje | O que o produto precisa entregar |
|---|---|---|
| **Dono do salão/clínica** | Não sabe se está lucrando de verdade; comissão é fonte de atrito com a equipe; no-show corrói a agenda; medo de erro fiscal | Visão financeira clara e diária; comissão transparente e auditável (já existe a máquina de estados — falta expor bem); redução de no-show; conformidade sem esforço manual |
| **Profissional (cabeleireiro, esteticista...)** | Não confia no cálculo da própria comissão; agenda cheia de furo; sem visibilidade do próprio desempenho | Extrato de comissão em tempo real; agenda do dia clara, inclusive no celular; indicador simples de performance (sem ser vigilância opressiva) |
| **Cliente final** | Hoje **não tem nenhuma superfície própria** — depende de ligar ou mandar WhatsApp pra agendar; sem lembrete automático; sem histórico do que já fez | Agendamento self-service (idealmente via WhatsApp, o canal dominante no Brasil); lembrete automático; histórico de atendimentos; programa de fidelidade |
| **Contador / compliance** | Sem trilha auditável fácil de exportar; risco de nota fiscal mal emitida | Auditoria já existe no backend (`AuditLog`) — falta expor; documento fiscal já tem máquina de estados — falta automação real do provedor |
| **Franqueador / dono de rede (pós-piloto)** | Sem visão consolidada entre unidades | Multi-tenancy já é premissa arquitetural — falta o painel admin-master (item já mapeado como sequenciável no adendo original) |

O ponto central: o sistema hoje é **100% voltado pro operador interno**. Nenhum concorrente forte nesse segmento (Trinks, Booksy, Fresha) vence sem uma superfície pro cliente final. Isso não é um "nice to have" — é a lacuna estrutural mais importante do produto hoje.

---

## 3. Diferenciais de mercado propostos (priorizados por impacto x esforço)

1. **Agendamento e lembrete via WhatsApp, não só app/web.** No Brasil, WhatsApp é o canal universal — mais gente confirma presença ali do que abrindo um app dedicado. Um link de confirmação/reagendamento via WhatsApp reduz no-show de forma desproporcional ao esforço de construir.
2. **Redução de no-show com sinal de risco + pagamento antecipado opcional via Pix.** Cliente com histórico de falta paga um sinal via Pix na confirmação. Pix já é o método de pagamento dominante no Brasil — o backend já suporta `PIX` como `PaymentMethod`.
3. **Extrato de comissão em tempo real pro profissional.** A máquina de estados de comissão (`PENDING → RELEASED/BLOCKED/CANCELED`) já existe — hoje só o dono vê. Expor isso pro profissional (mesmo que só leitura) é retenção de equipe de graça, aproveitando o que já foi construído.
4. **Alerta de "cliente sumiu".** Regra simples (cliente sem atendimento há N dias) rodando sobre dado que já existe (`Appointment`, `Attendance`, `Client`) — gera valor de retenção sem feature nova de captura de dado.
5. **Fechamento de caixa automático e conciliado.** `CashRegister` + `Payment` já existem — falta um resumo do dia (entradas por método, comissão do dia, o que falta bater) que hoje o dono provavelmente faz na mão ou em planilha.
6. **Widget de agendamento embutável (link na bio do Instagram, por exemplo).** Usa a mesma API de `availability`/`appointments` já construída, só que numa superfície pública e simplificada.
7. **Pacotes e assinaturas de manutenção** (ex.: manutenção capilar mensal). Muda o modelo de receita de transacional pra recorrente — diferencial forte, mas mexe em modelagem de dado nova (fora do MVP atual).

Itens 1–5 aproveitam machine de estados e modelos **já implementados** — o esforço real está na camada de integração/exposição, não em reconstruir o núcleo. Isso é o caminho de maior retorno por esforço.

---

## 4. Backlog por onda

### ONDA 2.1 — Fechar os gaps de CRUD (imediato, confirmado por Renato)
**Backend**, numa branch dedicada (`onda-2/backend-crud-completo` ou similar), com teste em cada endpoint:
- `PATCH /v1/clients/:id`
- `PATCH /v1/professionals/:id`
- `PATCH /v1/services-catalog/:id` (nome, descrição, duração, preço — hoje só existe o `/fiscal`)
- `PATCH /v1/products/:id`
- `POST /v1/users`, `PATCH /v1/users/:id`, `POST /v1/users/:id/block` (os `permission code` já existem no seed, só falta a rota)
- `POST /v1/roles`, atribuição de permissão a papel, atribuição de papel a usuário
- `PATCH /v1/business-settings`

**Frontend:** ligar cada tela já existente (Clientes, Profissionais, Serviços, Produtos, Configurações) ao novo endpoint — a UI de edição é reaproveitamento direto dos formulários de criação já construídos.

**Critério de pronto:** suíte Jest cobrindo cada transição + regra de negócio nova; `pnpm audit` limpo; `RUN-SUMMARY.md` atualizado — Definition of Done igual ao já usado pro Bloco 27.

### ONDA 3 — Elevar a UX do que já existe
- Agenda em **visão de calendário** (dia/semana, colunas por profissional) em vez de tabela — é como o segmento inteiro pensa a própria operação.
- Fluxo de atendimento otimizado pra celular/tablet na cadeira, não desktop.
- Confirmação de ações destrutivas (cancelar venda, cancelar comissão liberada) com feedback claro do "porquê não pode" quando a API recusa.
- Estados vazios com ação clara ("nenhum cliente ainda → cadastre o primeiro") em vez de tabela em branco.

### ONDA 4 — Superfície pro cliente final (o maior salto estratégico)
- Link de agendamento público (widget embutível), usando `availability` + `services-catalog` já existentes.
- Confirmação e lembrete via WhatsApp (integração com WhatsApp Business API ou provedor tipo Twilio/Zenvia).
- Pix como sinal de confirmação pra clientes de alto risco de no-show.
- Histórico do cliente (o que já fez, quando volta).

### ONDA 5 — Inteligência operacional
- Painel financeiro do dono: resumo diário de caixa, comissão, faturamento por profissional/serviço.
- Alerta de "cliente sumiu" / campanha de reativação.
- Sugestão de horário ótimo na agenda (preenchimento de buraco, sem ser IA pesada no início — regra heurística já resolve 80%).

### ONDA 6 — Pós-piloto (alinhado ao que o adendo original já classificou como sequenciável)
- Painel admin-master multi-tenant, billing status.
- Pacotes/assinaturas recorrentes.
- White-label, marketplace de descoberta de salões (expansão de aquisição de cliente).

---

## 5. Princípios de UX/UI pra reter e encantar

- **Português claro, nunca "erro 403"** — toda mensagem de erro da API já tem `title`/`message`/`recommendedAction` estruturados (`HttpExceptionFilter`); a UI deve sempre mostrar a mensagem humana, nunca o código cru.
- **Mobile-first onde a ação acontece na cadeira/balcão** (atendimento, checkout, caixa) — desktop-first só faz sentido pra telas de gestão/relatório.
- **Feedback imediato, otimista quando seguro** — toda ação já dispara toast + refresh; o próximo passo é UI otimista pra ações de baixo risco (ex.: adicionar item na venda).
- **Nada de tela vazia sem próximo passo óbvio.**
- **Identidade visual do salão no widget de cliente** (logo/cor) — isso é o que faz o cliente final sentir que é "o site do salão", não "mais um sistema genérico".
- **Consistência de padrão já estabelecida** (DataTable, EntityDialog, StatusBadge) — qualquer tela nova deve reaproveitar, não reinventar.

---

## 6. Decisão pendente com Renato

- [ ] Confirmar prioridade da ONDA 2.1 (CRUD) como próximo bloco de execução — já confirmado por Renato em 25/07/2026, registrar aqui como decidido assim que a branch abrir.
- [ ] Confirmar se ONDA 4 (superfície do cliente/WhatsApp/Pix) é a aposta estratégica certa antes do go-live do piloto, ou se entra só pós-validação com Mix Concept Hair.
- [ ] Confirmar provedor de WhatsApp Business API a avaliar (ex.: Twilio, Zenvia, Meta Cloud API direto) quando a ONDA 4 for priorizada — decisão de fornecedor fica pra quando chegar lá, não trava o backlog agora.

---

*Documento gerado por Claude a pedido de Renato, com base no estado real do código (backend + frontend) e no dinamismo do segmento de beleza/estética no Brasil. Pendente de revisão e ajuste antes de virar decisão registrada, seguindo o mesmo padrão do adendo de governança original.*
