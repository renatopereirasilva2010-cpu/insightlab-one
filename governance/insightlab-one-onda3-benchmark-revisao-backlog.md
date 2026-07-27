# InsightLab One — ONDA 3: Revisão de Backlog com Benchmark de Mercado

**Status:** Decisão registrada por Renato em 27/07/2026, a partir do relatório de benchmark de mercado (Trinks, Avec, Zenoti, Fresha).
**Referência:** `BACKLOG_PRODUTO_E_DIFERENCIACAO.md` (25/07/2026) · Relatório de benchmark publicado em 27/07/2026 (Trinks, Avec pesquisados em profundidade; Zenoti e Fresha como referência internacional).
**Ponto de partida:** núcleo transacional fechado (Bloco 27 + itens 9/13/14 do MVP UX review), branch `onda-2/backend-crud-completo`.

---

## 1. Por que este adendo existe

O backlog de 25/07 já apontava a lacuna estratégica certa — ausência de superfície pro cliente final — com base em julgamento interno. A pesquisa de benchmark de 27/07 confirmou essa leitura com evidência de mercado concreta (nenhum dos 4 concorrentes pesquisados vive sem isso) e trouxe 3 achados que o backlog original não cobria. Este documento formaliza o que muda no backlog a partir dessa evidência nova, seguindo o formato ONDA|FASE|ETAPA exigido pelo `CLAUDE.md` para propostas técnicas maiores.

**Fontes da pesquisa:** negocios.trinks.com/planos, ajuda.trinks.com/comissao, negocios.avec.app, lp.avec.app/programa-para-salao, help.zenoti.com/point-of-sale, fresha.com/pricing, conta4.com.br (NFS-e nacional 2026) — consultadas em 27/07/2026.

---

## 2. Decisões registradas

1. **ONDA 3 e ONDA 4 do backlog original são confirmadas**, agora com evidência de mercado, não só leitura interna.
2. **Novo item de alta prioridade inserido na ONDA 3**: extrato de comissão somente-leitura para o profissional — sai na frente do resto da UX porque é barato (reaproveita a máquina de estados de `Commission` já pronta) e todo concorrente pesquisado já trata isso como padrão, não diferencial.
3. **Nova onda formal para automação fiscal** — antes tratada como "fora de escopo do dia" durante o fechamento do item 14; a pesquisa muda o status dela de "melhoria futura" para "expectativa de mercado/legislação 2026" (NFS-e nacional obrigatória + Trinks já anuncia emissão automatizada como recurso de prateleira).
4. **Split automático de pagamento com adquirente/maquininha registrado como decisão futura pós-piloto** — não vira onda ativa agora, mas fica documentado para não se perder, dado o esforço de integração/homologação que implica.

---

## 3. ONDA 3 revisada — UX existente + comissão do profissional

### FASE 1 — Extrato de comissão do profissional (ETAPA imediata, sai na frente do resto da ONDA 3)

**Objetivo:** dar ao profissional visão somente-leitura da própria comissão (base, valor, status, histórico), sem tocar no cálculo ou nas regras já fechadas nos itens 13/14.

**O que será feito:**
- Endpoint de leitura escopado ao próprio profissional (`GET /v1/professionals/me/commissions` ou equivalente), reaproveitando `CommissionsService.findAllByTenant` com filtro adicional por profissional autenticado.
- Tela nova, somente leitura, sem ações de liberar/bloquear/cancelar (essas continuam exclusivas do dono/gestor).
- Papel/permissão nova pro profissional acessar só o próprio extrato — não pode ver comissão de outro profissional.

**O que não será feito:**
- Nenhuma mudança na lógica de cálculo, liberação ou geração de comissão (itens 13/14 já fecharam essa regra).
- Nenhum app mobile dedicado nesta etapa — web responsivo primeiro.

**Riscos:** vazamento de dado entre profissionais se o filtro por identidade falhar — mitigado por teste explícito garantindo que a query nunca retorna comissão de outro `professionalId`.

**TERMINAL 1 — Pré-voo:** branch dedicada a partir de `onda-2/backend-crud-completo`; revisão do modelo de permissão atual (achado do dia: `professionals.update` está faltando no seed do papel admin — corrigir isso junto, é pré-requisito pra qualquer tela nova de profissional).

**TERMINAL 2 — Execução:** endpoint + tela, com teste cobrindo isolamento por profissional (Zona Amarela, normal).

**TERMINAL 3 — Validação:** suíte Jest verde + teste manual logado como usuário com papel "profissional" confirmando que só vê a própria comissão.

**Critério de sucesso:** profissional autenticado consegue ver extrato próprio; nenhuma outra permissão nova é concedida além disso.

### FASE 2 — UX existente (herda o escopo original da ONDA 3 do backlog de 25/07)
- Agenda em visão de calendário (dia/semana, colunas por profissional) — confirmado pelo benchmark como expectativa mínima do segmento, não diferencial.
- Fluxo de atendimento otimizado pra celular/tablet.
- Estados vazios com ação clara.
*(Sem mudança de escopo nesta FASE — só reafirmando o que já estava proposto, com prioridade abaixo da FASE 1.)*

---

## 4. ONDA nova — Automação fiscal (compliance 2026)

**Objetivo:** disparar emissão de documento fiscal automaticamente a partir de um evento real do sistema (fechamento de venda/pagamento), em vez de depender de alguém acionar manualmente o status — fechando o gap que o item 14 identificou mas não endereçou por ser grande demais pra um ajuste pontual.

**O que será feito:**
- Avaliação de provedor de emissão (integração direta com Ambiente Nacional da NFS-e, ou gateway intermediário tipo eNotas/Focus NFe) — decisão de fornecedor fica pra dentro desta onda, não trava a proposta agora.
- Gatilho automático: ao pagamento ser confirmado (`status: PAID`) ou venda completada, criar o documento fiscal via evento interno, não mais via botão manual do usuário.
- Preserva a máquina de estados já existente (`DRAFT → REQUESTED → AUTHORIZED/FAILED/CANCELED`) e a restrição já fechada hoje (origem sempre `SALE` ou `PAYMENT` real, nunca `MANUAL`).

**O que não será feito:**
- Nenhuma mudança retroativa nos documentos fiscais históricos já existentes (os 16 registros `MANUAL` legados continuam como estão).
- Nenhuma remoção da criação manual como fallback de correção pro time de suporte — só deixa de ser o caminho padrão pro usuário operacional.

**Riscos:** falha de emissão automática travando o fechamento de venda se mal implementado — mitigado por rodar o disparo fiscal de forma assíncrona/desacoplada do fluxo de checkout, nunca bloqueante.

**TERMINAL 1 — Pré-voo:** decisão de fornecedor de emissão (Zona Amarela — pesquisa e proposta, sem custo/compromisso ainda); mapeamento dos eventos de disparo (`payment.status = PAID`, `sale.status = COMPLETED`).

**TERMINAL 2 — Execução:** branch dedicada; implementação do disparo automático + integração com provedor escolhido.

**TERMINAL 3 — Validação:** suíte de teste cobrindo o disparo automático fim a fim (mockando o provedor); teste manual em ambiente de homologação do provedor antes de qualquer emissão real.

**Critério de sucesso:** documento fiscal nasce sozinho ao fechar uma venda/pagamento elegível, sem ação manual; criação manual continua disponível só como exceção/correção.

**Nota de escopo:** esta onda **não abre sozinha** — precisa de decisão de fornecedor e de orçamento/custo de integração antes de qualquer branch de execução. Fica registrada como próxima proposta formal, não como trabalho já autorizado.

---

## 5. Registrado como decisão futura — não é onda ativa agora

**Split automático de pagamento com adquirente/maquininha.** A Avec processa e reparte o pagamento no momento em que ele acontece na maquininha — integração real com o meio de pagamento, não só cálculo de comissão depois do fato. Isso é mais fundo do que qualquer item hoje no backlog. Fica documentado aqui para não se perder, mas entra na conversa só pós-piloto, dado o esforço de certificação/homologação com adquirente que isso implica.

---

## 6. Checklist de decisão pendente com Renato

- [ ] Confirmar FASE 1 (extrato de comissão) como próximo bloco de execução, branch dedicada
- [ ] Corrigir o gap de permissão `professionals.update` no seed do papel admin (pré-requisito da FASE 1)
- [ ] Priorizar FASE 2 (UX/calendário) em relação à onda de automação fiscal — qual vem primeiro
- [ ] Escolher fornecedor de emissão fiscal a avaliar (NFS-e nacional direto vs. eNotas/Focus NFe/similar) antes de abrir a onda de automação fiscal
- [ ] Confirmar que split de pagamento com adquirente fica mesmo pós-piloto, sem reabrir agora

---

*Documento gerado por Claude a pedido de Renato, a partir do relatório de benchmark de 27/07/2026 e do backlog de 25/07/2026. Registra decisão — não é mais proposta pendente de confirmação inicial, mas os itens de escopo maior (automação fiscal, split de pagamento) seguem exigindo abertura formal de onda própria antes de qualquer código.*
