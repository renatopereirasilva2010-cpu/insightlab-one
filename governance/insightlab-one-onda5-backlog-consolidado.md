# InsightLab One — ONDA 5: Backlog Consolidado Pendente (28/07/2026)

**Status:** Levantamento a pedido de Renato — consolida o que já foi entregue e o que ainda falta, substituindo a numeração de ONDA espalhada em documentos anteriores por um retrato único do estado real.
**Por que este documento existe:** `BACKLOG_PRODUTO_E_DIFERENCIACAO.md` (25/07) propôs uma sequência ONDA 2.1→6; `insightlab-one-onda3-benchmark-revisao-backlog.md` (27/07) e `insightlab-one-onda4-automacao-fiscal.md` (27-28/07) reusaram os números "3" e "4" pra outra coisa (evidência de benchmark + prazo legal reordenaram a fila). **Os números de ONDA não são mais uma linha do tempo confiável — este documento é.**

---

## 1. O que já está pronto (não é mais backlog)

| Entrega | Onde | Status |
|---|---|---|
| Núcleo transacional (agenda, atendimento, venda, checkout, pagamento, caixa, comissão, multi-tenancy, RLS, auditoria) | Backend | Fechado, testado |
| CRUD completo (clientes, profissionais, serviços, produtos, usuários, papéis, configurações) | Backend + Frontend | Fechado 26/07/2026 |
| Regras de negócio: cliente obrigatório na venda, comissão presa ao item/profissional, documento fiscal só de origem real (nunca manual) | Backend | Fechado |
| Extrato de comissão do profissional (somente leitura) + vínculo conta↔profissional | Backend + Frontend | Fechado 27/07/2026 |
| Calendário de Agenda (dia/semana, colunas por profissional) | Frontend | Fechado 27/07/2026 |
| Estados vazios com ação clara (14 telas) | Frontend | Fechado 27/07/2026 |
| Correção de overflow mobile/tablet no shell do dashboard | Frontend | Fechado 27/07/2026 |
| Automação fiscal FASE 1 — gatilho automático de documento fiscal ao completar venda, sem custo, sem chamada externa | Backend | Fechado 27/07/2026 |
| Confirmação de ações destrutivas (cancelar venda/agendamento, etc.) | Frontend | Fechado (sessão anterior) |
| Sanitização de dado de teste travado (carrinhos abertos sem profissional) + limpeza de 32 arquivos `.bak` órfãos do git | Repo/DB | Fechado 28/07/2026 |

---

## 2. Backlog pendente — por que ainda não fechou, o que falta, quem decide

### 2.1 Automação fiscal FASE 2 — Focus NFe real
**Status:** rebaixada pra final da fila em 28/07/2026 (decisão de Renato — ver `insightlab-one-onda4-automacao-fiscal.md` seção 9).
**Bloqueio:** CNPJ do InsightLab One não existe ainda; modelo de cobrança do serviço pros tenants (Mix incluso) não está definido; custo real do fornecedor (R$109+/mês).
**O que já está pronto esperando:** toda a infraestrutura de disparo (FASE 1) já funciona — plugar o provider real é trabalho de um dia quando as três pendências acima resolverem.

### 2.2 Apps mobile — pesquisa feita, decisão pendente
**Status:** pesquisa de mercado concluída em 28/07/2026 (ver seção 3 abaixo). Decisão de quantos apps e qual escopo cada um cobre é sua, após comparar com os players e definir o diferencial do InsightLab One.
**Nada foi implementado ainda** — é decisão de arquitetura de produto, não código pronto pra revisar.

### 2.3 Superfície pro cliente final (agendamento self-service, WhatsApp, Pix)
**Status:** identificado como "maior lacuna estratégica" desde 25/07 (`BACKLOG_PRODUTO_E_DIFERENCIACAO.md` seção 2) — ainda não iniciado.
**O que envolve:**
- Link/widget de agendamento público embutível (reaproveita API de `availability`/`services-catalog` já pronta).
- Confirmação e lembrete via WhatsApp — precisa de fornecedor (Twilio, Zenvia, ou Meta Cloud API direto) e decisão de custo, mesmo padrão do Focus NFe (decisão de fornecedor só quando a onda for priorizada, não trava agora).
- Pix como sinal de confirmação pra reduzir no-show — backend já suporta `PIX` como `PaymentMethod`, falta o fluxo de cobrança antecipada.
- Histórico do cliente (o que já fez, quando volta).
**Por que importa:** nenhum concorrente forte do segmento (Trinks, Avec, Booksy, Fresha) vence sem isso — hoje o InsightLab One é 100% voltado pro operador interno, o cliente final não tem nenhuma porta de entrada própria.
**Decisão pendente:** entra antes ou depois do go-live do piloto com a Mix Concept Hair? Documento original deixou em aberto.

### 2.4 Inteligência operacional
- Painel financeiro do dono (resumo diário: caixa, comissão, faturamento por profissional/serviço) — dado já existe (`CashRegister`, `Payment`, `Commission`), falta o resumo agregado.
- Alerta de "cliente sumiu" (regra simples sobre `Appointment`/`Attendance`/`Client` já existentes).
- Sugestão de horário ótimo na agenda (heurística simples resolve a maior parte, sem precisar de IA pesada no início).
**Status:** não iniciado, sem bloqueio externo — é só priorização.

### 2.5 Estorno de comissão liberada
**Status:** identificado em 25/07 durante a varredura final do backend (`REGISTRO_VARREDURA_FINAL_BACKLOG_MVP.md`) — `Commission.cancel()` hoje rejeita comissão em `RELEASED` porque estornar dinheiro já liberado é decisão de domínio financeiro separada (não é só mudar um status, é decidir o que acontece com o valor).
**Decisão pendente:** qual a regra de negócio pra estornar comissão já paga/liberada ao profissional.

### 2.6 Pós-piloto (sequenciável, sem bloqueio técnico, só faz sentido com mais de 1 tenant)
Herdado do corte de MVP original (`insightlab-one-onda0-adendo-governanca.md` seção 2.2/2.3) — nada disso muda até o piloto validar:
- Painel admin-master multi-tenant + billing status.
- Estoque/compras/suprimentos — só entra se a Mix depender disso no dia a dia (avaliação ainda não feita).
- Planos/add-ons/entitlements (versão mínima governada primeiro).
- Pacotes e assinaturas recorrentes (muda modelo de receita de transacional pra recorrente — modelagem de dado nova).
- White-label, marketplace de descoberta de salão.
- Migração assistida de outros tenants (parsing real de FDB/CSV/XLSX — decisão já confirmada como pós-piloto).
- DevSecOps/qualidade formal completa (hoje só a higiene mínima da seção 7 do adendo original roda).
- Split automático de pagamento com adquirente/maquininha (`insightlab-one-onda3-benchmark-revisao-backlog.md` seção 5) — mais fundo que qualquer item hoje, exige homologação com adquirente.

---

## 3. Apps mobile — pesquisa de mercado (28/07/2026)

**Pergunta:** um app único que muda de acordo com o perfil do usuário logado, ou apps separados por perfil?

**O que os concorrentes pesquisados fazem — nenhum usa app único multi-perfil:**

| Player | Apps que mantém |
|---|---|
| **Trinks** | "Trinks Profissional" (app do profissional/staff — agenda, check-in) separado do app/fluxo de agendamento do cliente final |
| **Avec** | "AVEC PRO" (app do profissional, com split de pagamento em tempo real integrado) separado da experiência do cliente (agendamento via Instagram/WhatsApp/app white-label) |
| **Zenoti** | Confirma explicitamente **dois apps**: um de gestão (dono + equipe, operações do dia a dia) e um app de consumidor pro cliente final agendar/check-in/pagar |
| **Fresha** | App de consumidor pra descoberta e agendamento; lado do negócio tratado separadamente |

**Padrão de mercado, sem exceção encontrada:** sempre pelo menos **dois** apps — um voltado a quem opera (dono+equipe, às vezes dono e staff no mesmo app como o Zenoti faz) e um voltado ao cliente final, nunca um único app que troca de cara conforme o perfil logado.

**Por que isso faz sentido tecnicamente, não só por costume de mercado:**
- O cliente final e o profissional/dono têm necessidades de UX radicalmente diferentes (descoberta+agendamento vs. operação do dia a dia) — forçar os dois numa mesma casca de app tende a gerar uma experiência pior pros dois lados.
- App de cliente final precisa aparecer na loja com nome/ícone que o consumidor reconhece (ou ser white-label por tenant, como o Avec faz) — um app "InsightLab One" genérico não vende bem pro cliente final de um salão específico.
- App de staff/dono pode reaproveitar quase tudo que já existe no dashboard web (mesma API, mesma lógica de permissão por papel) — é a extensão natural do que já foi construído hoje.

**Recomendação (não é decisão — é insumo pra sua pesquisa):** ao menos 2 frentes de mobile, não 1:
1. **App de operação** (dono + equipe) — extensão mobile do dashboard web já existente, mesma API, aproveitando o sistema de permissões por papel que já diferencia Admin de Profissional na web hoje.
2. **App/superfície de cliente final** — depende diretamente da decisão da seção 2.3 (superfície pro cliente); pode nascer como widget web embutível antes de virar app nativo, reduzindo o investimento inicial.

**Decisão final é sua**, após comparar com os players, avaliar necessidade real de mercado e definir o diferencial do InsightLab One — este documento só traz o que os concorrentes fazem e por quê.

**Fontes consultadas em 28/07/2026:** ajuda.trinks.com (Aplicativo Trinks Profissional), apps.apple.com/Trinks Profissional, negocios.avec.app/avec-pro, zenoti.com/platform/zenoti-mobile-app, zenoti.com/product/cma, thesalonbusiness.com (Fresha vs. Zenoti).

---

## 4. Checklist de decisão pendente com Renato

- [ ] Quantos apps mobile e com que escopo cada um (pesquisa acima é insumo, decisão é sua)
- [ ] Superfície pro cliente final entra antes ou depois do go-live do piloto
- [ ] Fornecedor de WhatsApp Business API a avaliar, quando essa onda for priorizada
- [ ] Regra de negócio pra estorno de comissão já liberada
- [ ] Priorização entre inteligência operacional (seção 2.4) e superfície do cliente (seção 2.3) — qual vem primeiro
- [ ] Confirmar que Focus NFe FASE 2, admin-master, estoque, planos/add-ons, white-label e split de pagamento seguem mesmo fora da fila ativa por ora

---

*Documento gerado por Claude a pedido de Renato, consolidando `BACKLOG_PRODUTO_E_DIFERENCIACAO.md` (25/07), `insightlab-one-onda3-benchmark-revisao-backlog.md` (27/07), `insightlab-one-onda4-automacao-fiscal.md` (27-28/07) e `REGISTRO_VARREDURA_FINAL_BACKLOG_MVP.md` (25/07) num único retrato do estado atual. Nenhuma decisão de priorização foi tomada por Claude — apenas levantamento e pesquisa, como pedido.*
