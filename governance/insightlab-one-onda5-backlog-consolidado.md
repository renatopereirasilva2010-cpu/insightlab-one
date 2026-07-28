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
| Histórico do cliente (agendamentos/atendimentos/vendas, resumo de gasto e última visita) | Frontend | Fechado 28/07/2026 |
| Painel — resumo diário (faturamento, comissão, caixa, faturamento por profissional/serviço) | Frontend | Fechado 28/07/2026 |
| Alerta de "cliente sumiu" (filtro 30/45/60/90 dias sem aparecer) | Frontend | Fechado 28/07/2026 |
| Widget de agendamento público (`/agendar/[tenantSlug]`) — cliente final agenda sozinho, sem login, com rate limit e reaproveitando a validação de conflito já existente | Backend + Frontend | Fechado 28/07/2026 |
| Bug real corrigido: `proxy.ts` (middleware do Next 16) redirecionava qualquer rota sem sessão pro login, inclusive rotas públicas novas | Frontend | Fechado 28/07/2026 |

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
**Status:** identificado como "maior lacuna estratégica" desde 25/07 (`BACKLOG_PRODUTO_E_DIFERENCIACAO.md` seção 2). Histórico do cliente e **widget de agendamento público** (`/agendar/[tenantSlug]`) já saíram daqui — fechados em 28/07/2026 (seção 1). WhatsApp/Pix seguem não iniciados; pesquisa de fornecedor concluída em 28/07/2026 (seções 4 e 5).
**O que envolve:**
- Link/widget de agendamento público embutível (reaproveita API de `availability`/`services-catalog` já pronta) — próximo item viável a implementar, sem bloqueio de fornecedor.
- Confirmação e lembrete via WhatsApp — pesquisa de fornecedor concluída (seção 3.2), recomendação: Meta Cloud API direto. Decisão de contratar/implementar é sua.
- Pix e split de pagamento pra reduzir no-show — pesquisa de fornecedor concluída (seção 3.1), recomendação: Asaas. Decisão de contratar/implementar é sua.
**Por que importa:** nenhum concorrente forte do segmento (Trinks, Avec, Booksy, Fresha) vence sem isso — hoje o InsightLab One é 100% voltado pro operador interno, o cliente final não tem nenhuma porta de entrada própria.
**Decisão pendente:** entra antes ou depois do go-live do piloto com a Mix Concept Hair? Documento original deixou em aberto.

### 2.4 Inteligência operacional
- ~~Painel financeiro do dono~~ — fechado 28/07/2026 (seção 1).
- ~~Alerta de "cliente sumiu"~~ — fechado 28/07/2026 (seção 1).
- Sugestão de horário ótimo na agenda (heurística simples resolve a maior parte, sem precisar de IA pesada no início).
**Status:** só falta a sugestão de horário — não iniciado, sem bloqueio externo, é só priorização (baixo impacto estratégico, deixar por último).

### 2.3.1 Identidade visual e redes sociais do cliente final (novo, 28/07/2026)
**Status:** não mapeado até agora — Renato pediu que fosse incluído explicitamente no backlog em 28/07/2026.
**O que envolve:** o InsightLab One precisa nascer com recursos gráficos (logo/cor por tenant no widget de agendamento, já citado como princípio de UX em `BACKLOG_PRODUTO_E_DIFERENCIACAO.md` seção 5) e integração com redes sociais do cliente final (ex.: link de agendamento na bio do Instagram, botão de agendar direto pelo WhatsApp/Instagram, exibição de avaliações/depoimentos) — tudo que aumenta engajamento e percepção de valor do público-alvo de cada salão.
**Onde encaixa:** é a mesma frente do white-label (seção 4) — por isso Renato decidiu que isso entra **depois** do backlog operacional fechar, junto com a aplicação da identidade visual do InsightLab/InsightLab One e do white-label dos tenants (Mix Concept Hair como piloto). Registrado aqui pra não se perder, não pra entrar na fila agora.
**Depende de:** o widget de agendamento público (seção 2.3) existir primeiro — é a superfície onde a identidade visual e os links sociais aparecem.

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

### 3.1 Stack recomendada e timing (28/07/2026)

**Pergunta:** qual stack pra cobrir iOS e Android com um só código-fonte, e quando construir — junto com o resto do backlog ou só depois, reaproveitando o que já existe?

**Stack recomendada: React Native.**
- O InsightLab One já é 100% TypeScript/React (Next.js no web) — React Native reaproveita conhecimento, padrões de componente, hooks e, principalmente, a **lógica de negócio** (validação de formulário, formatação de moeda/data, tipos de `api-types.ts`, chamadas à mesma API REST) quase sem reescrever. Só a camada de UI precisa ser refeita — o que já era esperado.
- Ecossistema maduro, gratuito, sem licença — mesma filosofia de "custo zero, mas funcional e escalável" já aplicada nas outras decisões técnicas do projeto.
- Alternativa avaliada: **Flutter** (Dart) — performance nativa melhor e cobre mais plataformas de uma vez (web/desktop também), mas exige aprender uma linguagem nova e não reaproveita nada do código TypeScript já escrito. Só faria sentido se performance fosse o gargalo real, o que não é o caso pra um app de agenda/comissão/booking.

**Quando construir: no final, não junto com o resto do backlog.** Três motivos:
1. **Reaproveitamento é maior quanto mais o backend/API estabilizar** — cada endpoint novo criado agora (painel, histórico do cliente, etc.) já vira "de graça" reaproveitável pro app mobile depois, sem retrabalho.
2. **App de cliente final (uma das duas frentes da seção 3) depende da superfície pública de agendamento existir primeiro** (seção 2.3) — não tem o que embrulhar em app antes da funcionalidade web existir.
3. Abrir uma nova plataforma (App Store, Play Store, build/release pipeline, revisão da Apple) é o item de **maior esforço/complexidade de todo o backlog** — bate exatamente com o critério de "menos viável agora" usado pra priorizar toda essa lista.

**Conclusão:** mesmo racional dos outros itens de infraestrutura paga (Focus NFe, Pix, WhatsApp) — decisão de arquitetura correta, mas execução fica pro fim da fila, depois que o resto do backlog fechar.

---

## 4. Pagamento via Pix e split automático — pesquisa de mercado (28/07/2026)

**Pergunta:** qual adquirente/PSP viabiliza Pix e split de pagamento com o menor custo de implantação/manutenção? Precisa de maquininha própria, ou dá pra integrar com a maquininha que o cliente já tem?

**Achado técnico que muda a pergunta:** split de pagamento **em cartão presencial (maquininha)** só funciona através da própria maquininha do adquirente que vai processar o split — não existe forma de "interceptar" depois o valor de uma transação que rodou na maquininha de outro adquirente, porque quem controla a liquidação é quem processou o pagamento. Isso não é limitação de fornecedor, é como o sistema financeiro funciona. Então a pergunta "integra com a maquininha do cliente" só tem resposta "sim" pra **Pix e link de pagamento** (online), nunca pra cartão físico de outro adquirente.

| Opção | Custo | Precisa maquininha própria? | Cobre |
|---|---|---|---|
| **Asaas** | **Sem mensalidade nem taxa de adesão** — modelo 100% transacional, só paga pelo que usa; taxa promocional nos 3 primeiros meses pra Pix/boleto/link | **Não** — split funciona via Pix, boleto e link de pagamento, 100% online | Pix, boleto, link — não cobre cartão presencial |
| **Mercado Pago** | Taxa por transação, comissão do split descontada em cascata (primeiro a do MP, depois a do marketplace) | Não pra split online; teria maquininha própria só se quiser cobrir cartão presencial também | Pix, cartão online, e cartão presencial se usar a maquininha própria deles |
| **Pagar.me/Stone** | Taxa negociada por volume (débito ~1,29–1,69% em 2026); split desenhado pra grandes marketplaces (Carrefour, Raia Drogasil já usam) | Sim, pra cobrir cartão presencial — tem modelo de comodato (equipamento sem aluguel acima de um faturamento mínimo) | Split mais robusto do mercado, mas overkill de custo/complexidade pro estágio atual |

**Recomendação: Asaas, começando só por Pix/link de pagamento.** Cobre exatamente o caso de uso do backlog (sinal de confirmação pra reduzir no-show, seção 2.3) sem exigir maquininha nenhuma — o cliente paga um Pix/link de confirmação, o valor já nasce dividido entre salão e profissional se for o caso. Cartão presencial com split automático (a diferenciação real da Avec) fica de fora dessa recomendação — exigiria adquirente com maquininha própria (Stone é o mais citado no segmento), decisão maior, de custo real, que já está corretamente registrada como pós-piloto (seção 2.6).

**Achado regulatório a observar, não a agir agora:** a pesquisa encontrou menção a uma obrigação de segregação automática de CBS/IBS (reforma tributária) por parte de PSPs/marketplaces a partir de agosto de 2026. **Isso é obrigação do próprio adquirente/PSP (Mercado Pago, Asaas, etc.), não do InsightLab One** — mas vale confirmar com o fornecedor escolhido, quando chegar a hora, se isso muda alguma regra de como o split é configurado do nosso lado.

*Fontes consultadas em 28/07/2026: pagarme.helpjuice.com (split de pagamentos), calculadoradetaxas.com.br (taxas Stone 2026), mercadopago.com.br/developers (split payments), blog.asaas.com (split de pagamentos, APIs de split), asaas.com/precos-e-taxas.*

---

## 5. WhatsApp Business API — pesquisa de mercado (28/07/2026)

**Pergunta:** qual opção viabiliza confirmação/lembrete via WhatsApp com o menor custo?

**Achado central:** o acesso técnico à API oficial da Meta (Cloud API) é **gratuito** — criar app no Meta for Developers, conectar a conta Business, gerar token. O custo real está em duas camadas separadas:
1. **Custo por conversa iniciada** — cobrado pela própria Meta, ~R$0,24 a R$0,40 por conversa (varia por categoria), inevitável em qualquer fornecedor sério porque é repasse da Meta, não markup do fornecedor.
2. **BSP (Business Solution Provider)** — camada de gestão (múltiplos atendentes, templates, dashboard) que fornecedores como Zenvia/Take Blip cobram à parte, com taxa de setup de R$5-15 mil.

| Opção | Custo | Observação |
|---|---|---|
| **Meta Cloud API direto** | Zero de plataforma — só o custo por conversa da própria Meta | Exige montar a camada de envio/template você mesmo (o time já tem backend NestJS pra isso) — sem depender de BSP pago |
| **Twilio** | Pay-as-you-go, sem mensalidade, mas também repassa o custo por conversa da Meta | Documentação em inglês, mais flexível que precisamos pro caso de uso simples (confirmação/lembrete) |
| **Zenvia / Take Blip** | Taxa de setup R$5-15 mil + mensalidade | Faz sentido pra call center com múltiplos atendentes — não é o nosso caso (mensagem automática, não atendimento humano em massa) |
| ⚠️ **"APIs não-oficiais" (ex.: Whapi Cloud)** | Preço fixo, mensagens ilimitadas, parece a opção mais barata | **Não recomendado** — não usa a API oficial da Meta, risco real de banimento do número do salão sem aviso. Preço baixo demais pra um canal que o negócio depende |

**Recomendação: Meta Cloud API direto.** Pro caso de uso do backlog (confirmação de agendamento + lembrete automático, mensagem templada, não atendimento humano), não precisamos da camada de BSP paga — é overhead desnecessário. Custo fica restrito ao que a própria Meta cobra por conversa, sem intermediário. Monta-se a integração direto no backend NestJS já existente.

*Fontes consultadas em 28/07/2026: socialhub.pro (WhatsApp Business API gratuito 2026), zap-api.tech (comparativo 2026), apioficial.com.br (API Oficial vs Zenvia).*

---

## 6. Checklist de decisão pendente com Renato

- [ ] Quantos apps mobile e com que escopo cada um (pesquisa de player + stack prontas, decisão é sua)
- [ ] Superfície pro cliente final entra antes ou depois do go-live do piloto
- [ ] Confirmar Asaas (Pix/split online) e Meta Cloud API direto (WhatsApp) como fornecedores, ou pedir mais alternativas
- [ ] Regra de negócio pra estorno de comissão já liberada
- [ ] Priorização entre sugestão de horário ótimo (seção 2.4) e superfície do cliente (seção 2.3) — qual vem primeiro
- [ ] Confirmar que Focus NFe FASE 2, admin-master, estoque, planos/add-ons, white-label, identidade visual/redes sociais (seção 2.3.1) e split de pagamento com maquininha própria seguem fora da fila ativa por ora

---

*Documento gerado por Claude a pedido de Renato, consolidando `BACKLOG_PRODUTO_E_DIFERENCIACAO.md` (25/07), `insightlab-one-onda3-benchmark-revisao-backlog.md` (27/07), `insightlab-one-onda4-automacao-fiscal.md` (27-28/07) e `REGISTRO_VARREDURA_FINAL_BACKLOG_MVP.md` (25/07) num único retrato do estado atual. Nenhuma decisão de priorização foi tomada por Claude — apenas levantamento e pesquisa, como pedido.*
