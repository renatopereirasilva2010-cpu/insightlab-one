# InsightLab One — ONDA 4: Automação Fiscal (Compliance NFS-e Nacional 2026)

**Status:** FASE 1 confirmada por Renato e executada em 27/07/2026 — mergeada em `onda-2/backend-crud-completo` (fast-forward). Verificada end-to-end em dev via Playwright: pagamento completado gera o documento fiscal automaticamente, em DRAFT, sem ação manual, sem chamada externa. FASE 2 (Focus NFe real) segue bloqueada até a conta existir.
**Referência:** `governance/insightlab-one-onda3-benchmark-revisao-backlog.md` (seção 4, proposta original; seção 7, pesquisa de fornecedor e prazo legal).
**Ponto de partida:** núcleo transacional fechado (ONDA 3 FASE 1 + FASE 2, mergeadas em `onda-2/backend-crud-completo` em 27/07/2026).

---

## 1. Por que esta onda existe agora

Dois fatos mudaram desde que a automação fiscal era só "melhoria futura" no backlog:

1. **Prazo legal, não só tendência de mercado.** A partir de **01/09/2026**, MEs/EPPs do Simples Nacional prestadoras de serviço só podem emitir NFS-e padrão nacional pelo Emissor Nacional (web ou API) — perfil que a Mix Concept Hair provavelmente se enquadra. Faltam ~5 semanas a partir de hoje (27/07/2026).
2. **Fornecedor escolhido e reprorização aceita por Renato** (27/07/2026): Focus NFe, a partir de R$109/mês + R$0,65/documento excedente, sem taxa de setup, +3.000 municípios já integrados para NFS-e.

**O que ainda falta antes de qualquer código:** Renato precisa criar a conta na Focus NFe (dado de CNPJ/negócio, forma de pagamento) — isso não é algo que Claude Code possa fazer. Sem credencial real de API, a FASE 1 abaixo é construída com um provider "nulo"/mockável, pronta para receber a credencial real quando existir.

---

## 2. Corte de FASE 1 — o que entra agora vs. o que fica para depois

### 2.1 FASE 1 (esta proposta) — infraestrutura de disparo, sem chamada externa real
- Abstração de provider de emissão fiscal (`FiscalProvider` interface) — hoje só o que já existe no schema (`FiscalDocument.provider`), sem lock-in de fornecedor no código.
- Implementação `NullFiscalProvider` (não faz chamada HTTP nenhuma — só loga a intenção) usada enquanto não houver credencial real configurada via env var.
- Gatilho automático: quando `PaymentsService.markPaid()` leva a venda a `COMPLETED` (mesma transação que já existe hoje), criar o `FiscalDocument` em `DRAFT` vinculado à venda — **sem chamar nenhum provider dentro da transação de pagamento**, para não bloquear o checkout numa API externa (risco já identificado na ONDA 3 seção 4).
- Um segundo passo, fora da transação de pagamento, tenta mover `DRAFT → REQUESTED` chamando o provider configurado (Null por padrão).
- Preserva a máquina de estados já existente (`DRAFT → REQUESTED → AUTHORIZED/FAILED`, `AUTHORIZED → CANCELED`) e a restrição já fechada no item 14 do MVP review (origem sempre `SALE` ou `PAYMENT` real, nunca `MANUAL`).

### 2.2 Fica para uma FASE 2 (só depois que a conta Focus NFe existir)
- `FocusNfeProvider` real, com chamada HTTP autenticada, mapeamento de erro do provedor para `errorCode`/`errorMessage`.
- Configuração de credencial via variável de ambiente (`FOCUS_NFE_API_TOKEN` ou similar) — segredo, nunca commitado.
- Teste de ponta a ponta em ambiente de homologação do provedor (sandbox da Focus NFe), com nota real de teste.
- Job assíncrono com retry (avaliar BullMQ + Redis, que já está disponível via `REDIS_URL` no `.env`, mas hoje sem fila configurada no projeto) para reprocessar `REQUESTED` que não voltou resposta, em vez do disparo síncrono simplificado da FASE 1.

**Por que cortar assim:** a FASE 1 já entrega o essencial do gatilho automático (documento fiscal nasce sozinho, sem ação manual) e é 100% testável sem gastar um real ou esperar aprovação de conta externa. A FASE 2 é sobre a integração real, e só faz sentido depois que a conta Focus NFe existir.

---

## 3. O que não será feito

- Nenhuma mudança retroativa nos 16 documentos fiscais `MANUAL` legados — continuam como estão.
- Nenhuma remoção da criação manual como fallback de correção pro time de suporte (`FiscalDocumentsService.create()` continua existindo para `SALE`/`PAYMENT`, só `MANUAL` seguindo bloqueado desde o item 14).
- Nenhuma chamada HTTP real a qualquer provedor nesta FASE 1 — `NullFiscalProvider` é sempre o padrão até existir credencial configurada.
- Nenhuma migration de banco — o schema (`FiscalDocument.provider`, `referenceNumber`, `accessKey`, `errorCode`, `errorMessage`) já suporta tudo que a FASE 1 precisa.
- Nenhuma alteração no fluxo de checkout visível ao usuário — o disparo é interno, depois que o pagamento já foi confirmado.

---

## 4. Riscos

| Risco | Mitigação |
|---|---|
| Disparo fiscal bloqueando o checkout se chamar provider dentro da transação de pagamento | FASE 1 cria o `FiscalDocument` em `DRAFT` dentro da transação (é só um `INSERT` local, rápido) e só tenta avançar o status **depois**, fora da transação — nunca chamando provider externo enquanto o pagamento está sendo processado |
| `NullFiscalProvider` dar falsa sensação de "automação pronta" quando na verdade nenhuma nota real está sendo emitida | Evento `CREATED`/log explícito deixa claro que é um provider nulo; documento fica preso em `DRAFT`/`REQUESTED` sem `AUTHORIZED` real, visível na tela de Documentos Fiscais |
| Duplicar documento fiscal se `markPaid` for chamado mais de uma vez para a mesma venda | Reaproveita a constraint única já existente (`@@unique([tenantId, sourceType, sourceId, documentType])`) — segunda tentativa de criação vira no-op silencioso, não erro que quebra o pagamento |
| Provider real (FASE 2) exigir dado cadastral (CNPJ, inscrição municipal) que o `Unit` do tenant não tenha preenchido | Fora do escopo da FASE 1; validação de dado cadastral obrigatório entra como pré-requisito explícito da FASE 2 |

---

## 5. TERMINAL 1 — Pré-voo (Zona Verde, sem risco)

- Confirmar que `Unit` tem os campos necessários pro documento fiscal (`legalName`, `cnpj`, `municipalRegistration`, `city`, `state`, `ibgeCityCode`) — já existem no schema, usados em `buildUnitSnapshot()`.
- Revisar `PaymentsService.markPaid()` (linha 85-143 hoje) como ponto de integração.

## 6. TERMINAL 2 — Execução (Zona Amarela, branch dedicada)

- Branch `onda-4/automacao-fiscal-fase-1` a partir de `onda-2/backend-crud-completo`.
- `FiscalProvider` interface + `NullFiscalProvider` + módulo NestJS injetável.
- Hook em `PaymentsService.markPaid()`: ao setar `sale.status = 'COMPLETED'`, criar `FiscalDocument` em `DRAFT` (dentro da mesma transação, é só insert local).
- Método separado (chamado logo após a transação de pagamento commitar, não dentro dela) que tenta `DRAFT → REQUESTED` via o provider configurado.
- Testes cobrindo: criação automática do documento ao completar a venda, idempotência (não duplica em segunda chamada), e que o provider nulo nunca é chamado de dentro da transação de pagamento.

## 7. TERMINAL 3 — Validação

- Suíte Jest verde (backend completo, não só o módulo fiscal).
- Teste manual: completar uma venda no ambiente de dev e confirmar que o documento fiscal aparece automaticamente em Documentos Fiscais, em `DRAFT`, sem ação manual do usuário.
- `pnpm audit`/`npm audit` sem `high`/`critical` em aberto antes do merge, conforme higiene mínima já estabelecida.

**Critério de sucesso:** venda completada gera documento fiscal sozinha, sem botão manual; nenhuma chamada externa real acontece sem credencial configurada; suíte de teste verde; checkout não fica mais lento nem mais frágil do que está hoje.

**Se falhar:** reverter o commit do hook em `markPaid()` (é aditivo, não substitui lógica existente) e reportar o erro exato antes de tentar de novo.

---

## 8. Pendência que só Renato resolve

- [ ] Criar a conta Focus NFe (CNPJ da Mix Concept Hair, forma de pagamento) — pré-requisito da FASE 2, não da FASE 1.
- [x] Fornecedor escolhido (Focus NFe) — confirmado em 27/07/2026.
- [x] Reprorização (automação fiscal à frente de UX discricionária) — aceita em 27/07/2026.

## 9. FASE 2 reprorizada para o final da fila (28/07/2026)

Decisão de Renato: a integração real com Focus NFe (FASE 2) sai da posição "próximo passo lógico" e vai para o **final** do backlog geral — não por perder importância técnica, mas por três bloqueios de negócio que são dele resolver, não código:

1. **Custo real.** Focus NFe cobra a partir de R$109/mês mesmo com período de teste — não é decisão que se toma só tecnicamente.
2. **CNPJ do InsightLab One ainda não existe.** A conta no fornecedor de emissão fiscal precisa de CNPJ — pré-requisito que nem chegou a abrir ainda.
3. **Modelo de cobrança do serviço em aberto.** Ainda não está decidido como o InsightLab One (produto/empresa) vai tratar esse custo com os tenants: absorver, repassar, ou cobrar como add-on "padrão" — inclusive para o piloto (Mix Concept Hair), que hoje não paga nada pelo InsightLab One.

**O que isso muda na prática:** FASE 1 (já entregue, sem custo, sem chamada externa) continua funcionando normalmente — documento fiscal nasce em `DRAFT` a cada venda concluída. FASE 2 só entra na fila de execução depois que essas três pendências de negócio estiverem resolvidas, e mesmo assim como uma decisão explícita de reabrir a onda, não automática.

---

*Documento gerado por Claude a pedido de Renato, a partir da pesquisa de fornecedor e do achado de prazo legal registrados em `insightlab-one-onda3-benchmark-revisao-backlog.md` seção 7. FASE 1 (infraestrutura de disparo, sem custo, sem chamada externa) pode abrir branch assim que confirmada; FASE 2 (integração real com Focus NFe) fica bloqueada até a conta existir.*
