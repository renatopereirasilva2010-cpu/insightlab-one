# InsightLab One — ONDA 12: Higienização documental (D:\InsightLab) e mecanismo de importação de dados de clientes

**Status:** Executado por Claude Code em 31/07/2026, na branch `onda-2/backend-crud-completo`.
**Ponto de partida:** onda11 fechada (auditoria multi-persona), commits locais ainda não pushados.

---

## 1. Higienização documental — `/mnt/d/InsightLab` (fora do repositório git)

Renato pediu higienização da pasta `D:\InsightLab` (194 arquivos, ~194MB) — projeto no lado Windows, com dado real de cliente, histórico de scaffold, e documentos comerciais. Diagnóstico completo antes de qualquer ação; nada apagado sem evidência.

### 1.1 Documento-Mestre — apagado, mantida só a versão mais recente
18 versões dentro de `[CRITICAL_LLM]` no D:\, 5 cópias soltas na raiz do repositório git, 8 versões antigas em `docs/llm/` — todas apagadas. Sobrou **`docs/llm/InsightLab_One_Documento_Mestre_V56.txt`**, a mais recente, já versionada. Commit `9760573`.

### 1.2 Export de dados do AZ — comparação real de conteúdo, não só tamanho
`GENERAL REPORTS_AZ` (.XLS, 49MB) vs `Mix - Export de dados_AZ` (.xlsx, 13MB, renomeada por Renato durante a sessão) pareciam ter dados diferentes pelo tamanho. Comparação real (contagem de e-mails/linhas, não só bytes) mostrou que **o conteúdo é o mesmo** — a diferença de tamanho é só sobrecarga do formato binário `.XLS` antigo. Mantida `Mix - Export de dados_AZ`, apagada `GENERAL REPORTS_AZ` + `.zip`/`.rar` (cópias compactadas da pasta mantida).

### 1.3 Memória Total do Projeto — log de acréscimo puro, mantida só a última
39 versões (`[CRITICAL] Memoria_Total_Projeto_LLM_v2...v39`) confirmadas como puro acréscimo (cada versão contém a anterior inteira, testado em 5 pontos da série) — apagadas todas menos v39. `AGENTS_InsightLab_One_v2.md` e `RUN_SUMMARY_InsightLab_One_v2.md` confirmados byte-a-byte idênticos aos originais sem sufixo, apagados.

**Deixado para decisão de Renato** (menos claro-cut): `AGENTS_InsightLab_One.md`/`RUN_SUMMARY_InsightLab_One.md` (rascunhos ~5h mais antigos, não diffados), subpastas `docs/`/`governance/` dentro do `[CRITICAL_LLM]` (cópias antigas de CLAUDE.md/onda0-adendo — quase certamente superadas, mas histórico de governança pede um aval antes de apagar), pasta `InsightLab One - SCAFFOLD e FASES` inteira (recomendação: arquivar, não apagar — código real já superou tudo, confirmado abrindo um dos zips e achando o mesmo módulo `admin-master`/`migration-jobs` que já existe, mais evoluído, no repositório real).

Resultado: pasta caiu de 194MB para 104MB.

---

## 2. Decisão de governança: adiantar "migração assistida de outros tenants"

"Migração assistida" estava fechada como pós-piloto (`insightlab-one-onda0-adendo-governanca.md` §2.3). Depois da higienização acima deixar os dados reais do AZ organizados e utilizáveis, Renato pediu o mecanismo de importação — perguntado diretamente se isso significava adiantar a decisão, confirmou: **"Adiantar agora, decisão consciente."** Registrado em `insightlab-one-onda0-adendo-governanca.md` §2.3 (atualização 31/07) e `insightlab-one-onda5-backlog-consolidado.md` §2.6.

**Escopo adiantado, explicitamente limitado:** só importação de **Clientes** (nome/telefone/e-mail). Migração de histórico financeiro/agendamento de outros tenants, e parsing de `.FDB`, continuam pós-piloto — recriar `Sale`/`Appointment`/`Commission` reais a partir de relatórios agregados quebraria integridade referencial e criaria histórico financeiro retroativo inconsistente.

---

## 3. Mecanismo de importação — desenho e implementação

### 3.1 Reaproveitamento do que já existia
`MigrationJob`/`MigrationBatch` (Prisma) e o módulo `admin-master` já existiam, mas só como livro-razão manual — nenhum parser, nenhuma análise, nenhum import real. As permissões `admin-master.migration.create`/`.import`/`.reconcile` já existiam e **já estavam excluídas do papel Gerente** (`gerenteExcludedPrefixes = ['admin-master.']`) — reaproveitadas sem criar nada novo. Admin já tem todas as permissões por padrão (concessão de `allPermissions` no seed).

### 3.2 Backend (`services/api/src/modules/admin-master/`)
- Nova dependência: `xlsx` (SheetJS 0.18.5) — lê CSV/XLS/XLSX com a mesma API.
- `client-import-parser.ts` — funções puras: detecta a linha real de cabeçalho (pula o bloco de cabeçalho de relatório que exports como o do AZ trazem antes da tabela), sugere mapeamento de coluna por sinônimo em PT-BR, classifica cada linha como `IMPORTAVEL`/`PARCIAL`/`DUPLICADO`/`NAO_IMPORTAVEL` com o racional em texto.
- `client-import.service.ts` — `analyze()` (só leitura, verifica duplicata contra `Client` já existente por telefone) e `commit()` (reclassifica no servidor antes de gravar — **nunca confia nos índices aceitos vindos do frontend**, defesa em profundidade testada explicitamente).
- Novos endpoints: `POST /v1/admin-master/migration-jobs/:id/analyze` e `.../commit`, ambos atrás de `admin-master.migration.import`.
- `spreadsheet-upload.interceptor.ts` — mesmo padrão de `photo-upload.interceptor.ts`, disco local em `uploads/migrations/<tenantId>/`.

### 3.3 Frontend
Nova aba "Importação de Dados" em Configurações (`import-data-panel.tsx`), visível só com a permissão acima. Fluxo: upload → mapeamento de coluna (auto-sugerido, ajustável) → tela de revisão com `StatCard`s de resumo (reaproveitando o componente da onda10) + `DataTable` linha a linha com status colorido e racional → confirmação explícita → resultado. Nada é gravado antes da confirmação.

### 3.4 Validação
- `tsc --noEmit` limpo (web + api).
- `pnpm build` limpo (web + api).
- 17 testes novos (`client-import-parser.spec.ts`, `client-import.service.spec.ts`), incluindo o caso de segurança "nunca importa uma linha que o servidor reclassifica como não-importável, mesmo que o índice tenha sido aceito pelo cliente".
- Suíte completa do backend: 38 suites, 290 testes, verde (1 flake de timeout em `users.service.spec.ts` sob pressão de CPU do build concorrente, confirmado não-regressão ao rodar isolado).
- Playwright ponta a ponta: upload de CSV sintético, mapeamento auto-detectado corretamente, classificação de linha por linha conferida (importável/parcial/não-importável), commit real criando `Client`s de verdade, aparecendo em `/clientes`. Dado de teste removido depois da validação.

---

## 4. Import real dos dados do Mix — executado em 31/07/2026

Zona Vermelha (dado de tenant real) — confirmação explícita de Renato ("Pode seguir com a importação...") antes do clique final de "Confirmar importação". Arquivo: `CADASTRO DE CLIENTES_EMAIL_TELEFONE.xlsx` (7698 linhas).

**Resultado:** 7279 `Client` criados no tenant Mix (4704 `IMPORTAVEL` + 2575 `PARCIAL`, todos com checkbox aceito por padrão na revisão), 419 `NAO_IMPORTAVEL` ignorados (sem nome válido — inclui células com só pontuação, artefato do export do AZ). 0 duplicados. `source = IMPORT_CSV` em todos os registros criados, permitindo distinguir dado real importado de dado de demonstração pré-existente.

---

## 4.1 Bug crítico encontrado e corrigido logo após o import real

O import em si funcionou (7279 clientes gravados corretamente). Mas a tela `/clientes` quebrou (HTTP 500) imediatamente depois, ao tentar listar os clientes reais.

**Causa raiz:** durante a validação anterior (seção 3.4), o componente compartilhado `DataTable` (`apps/web/src/components/data-table.tsx`) tinha ganhado paginação client-side via `"use client"` + `useState`, pensada só pra tela de revisão de import. Isso quebrou silenciosamente **todas** as ~20 páginas Server Component do sistema que passam `columns` com funções de render (`cell: (row) => ...`) pro `DataTable` — funções não sobrevivem à fronteira Server→Client Component do React/Next ("Functions cannot be passed directly to Client Components"). O bug só ficou visível quando `/clientes` finalmente teve dado real suficiente pra ser efetivamente navegado depois da mudança; nenhuma verificação ponta a ponta tinha revisitado essas outras páginas depois do `pnpm build` anterior.

**Correção:**
- `DataTable` voltou a ser server-safe (sem `"use client"`, sem paginação embutida) — comportamento idêntico ao que existia antes da onda12 pra todo mundo, exceto quem precisa de paginação.
- Paginação client-side da tela de revisão de import ficou só dentro de `import-data-panel.tsx` (que já é `"use client"` — o estado de página vive lá, o `DataTable` recebe só a fatia de linhas já cortada).
- Adicional, achado na mesma investigação: `/clientes` também fazia `GET /v1/clients` sem paginação nenhuma — inofensivo com poucos clientes de demonstração, mas 7286 linhas de dado real numa tabela sem paginação teria travado o navegador de novo (mesma classe de problema já visto na tela de revisão). Adicionada paginação **opt-in** no backend (`page`/`pageSize` em `GET /v1/clients`, mesmo padrão já usado em `/v1/audit-logs`): sem esses parâmetros, o endpoint continua retornando a lista completa sem paginar — comportamento inalterado pra outras ~11 telas que dependem do array cheio (seletor de cliente em Agenda/Venda/Atendimento, lookups por id, relatório de clientes inativos). Só `/clientes` (a listagem administrativa) passou a usar os parâmetros e agora pagina 50 por página.

**Validado depois da correção:** `tsc --noEmit` limpo (web + api), `pnpm build` limpo (web + api), suíte Jest do backend reexecutada, Playwright confirmando `/clientes` (paginado, 146 páginas, dado real visível) e `/configuracoes?tab=import` funcionando sem erro, mais checagem pontual de `/profissionais` e `/` (Agenda, que depende do array completo pro seletor de cliente).

**Lição registrada:** mudar um componente compartilhado amplamente usado (`DataTable`, ~30 pontos de uso) pra resolver um problema de UMA tela específica é um raio de impacto que precisa ser explicitamente mapeado antes da mudança, não só testado no caminho feliz da tela que motivou a mudança — "backward compatible porque as outras chamadas não passam o prop novo" foi a suposição errada aqui: o prop novo não era o problema, a diretiva `"use client"` no topo do arquivo era.

---

## 4.2 Varredura completa da pasta `Mix - Export de dados_AZ` (32 arquivos) — resposta a "confirme se consegue importar todos os arquivos"

Em vez de construir um endpoint HTTP permanente pra "escanear um caminho de pasta arbitrário no disco do servidor" (superfície de risco real — leitura de arquivo arbitrário no servidor a partir do navegador — pra uma necessidade de uma vez só, não uma funcionalidade recorrente do produto), rodei um script Node pontual usando a mesma função `analyzeClientSpreadsheet` já validada, direto contra o `dist/` compilado, contra os 32 arquivos da pasta. Script descartável, não versionado (não é parte do produto).

**Achado central:** o heurístico de mapeamento de coluna "reconhece" uma coluna de nome em quase todos os 32 arquivos (todos mencionam cliente em algum lugar), mas a contagem de linhas denuncia o problema — arquivos com 26 mil a 52 mil linhas não podem ser um cadastro de ~7-8 mil clientes únicos. São relatórios de **histórico** (um agendamento, uma visita, uma posição de ranking por período = uma linha), não cadastro. Importar esses como `Client` criaria uma avalanche de registros duplicados/lixo e confundiria histórico transacional com cadastro — exatamente o risco que o plano original (seção "Achado real sobre os dados do AZ") já tinha identificado, agora confirmado nos 32 arquivos reais, não só no que já foi importado.

**Classificação final dos 32 arquivos:**

| Categoria | Arquivos | Decisão |
|---|---|---|
| ✅ Cadastro real, já importado | `CADASTRO DE CLIENTES_EMAIL_TELEFONE.xlsx` | Feito (seção 4) — 7279 clientes reais |
| ⚠️ Variante quase-duplicada, qualidade ruim pra este fim | `CADASTRO DE CLIENTES_EXCE L.xlsx` (7998 linhas) | **Não importar.** Contra os 4318 telefones já reais no banco: 4476 `DUPLICADO`, só 357 `IMPORTAVEL` — mas as amostras de linha "nova" retornaram literalmente `{name: "Nome", email: "Email"}` (a própria linha de cabeçalho repetida no meio dos dados, um artefato do export original, sendo classificada como cliente válido porque "Nome" e "Email" passam no teste de "parece um nome"). Precisaria de um filtro extra pra não confiar cegamente nisso — não vale o risco pra ~357 registros de qualidade duvidosa quando o arquivo mais limpo já foi importado. |
| ⚠️ Mapeamento de coluna falhou | `CADASTRO DE CLIENTES.xlsx` (13 linhas), `CADASTRO DE CLIENTES_PRIMEIRA VISITA.xlsx` (7586 linhas) | **Não importável como está** — a detecção de cabeçalho não achou coluna de telefone/e-mail nestes dois (estrutura diferente do padrão Código/Nome/E-Mail/Telefones); só nome ficou reconhecido, 0 encontrado como novo/importável de qualquer forma. |
| ➕ Registro válido, mas valor marginal | `CADASTRO DE CLIENTES_PRIMEIRA VISITA_PROFISSIONAL.xlsx` (7723 linhas) | Mapeamento funcionou e é genuinamente um cadastro (Nome do Cliente/Telefones/Código) — mas contra os telefones já reais no banco, só **5 clientes novos** (o resto, 4278, já está importado). Não compensa abrir um novo ciclo de revisão/confirmação pra 5 registros — mais rápido cadastrar manualmente se Renato quiser esses 5. |
| ❌ Histórico/relatório agregado, fora de escopo por decisão já travada | `AGENDA_AGENDAMENTOS POR CLIENTE*` (2 arquivos, 26-29 mil linhas), `CADASTRO DE CLIENTES_ANALÍTICO`/`_INCOMPLETOS` (39 mil linhas cada — múltiplas linhas por cliente, não cadastro), `CADASTRO DE CLIENTES_RANKING DE MAIOR CONSUMO*` (9 arquivos, 3-52 mil linhas cada, ranking de consumo por período), `ESTATÍSTICA GERAL_*` (6 arquivos, KPIs agregados), `NOVOS CLIENTES_EVOLUTIVO`, `TICKET MÉDIO`, `VISITAS POR CLIENTES_*` (5 arquivos, um por ano) | **Não importável por design, não só "não tentado".** Cada linha é um evento (agendamento/visita/posição de ranking/KPI), não um cliente. Recriar isso como `Client` ou pior, tentar reconstruir `Sale`/`Appointment`/`Commission` a partir daqui, é exatamente o que a seção 2 deste documento (e o plano original) já descartou — quebraria integridade referencial e criaria histórico financeiro retroativo inconsistente com caixa/comissão já fechados. |

**Resposta direta à pergunta "confirme se consegue importar todos os arquivos... se sim, pode importar também":** não, e o motivo não é limitação técnica do mecanismo — é que a maioria dos 32 arquivos não é, estruturalmente, um cadastro de clientes. O único arquivo que era um cadastro real, limpo e completo já foi importado (seção 4). Os outros três "quase-cadastros" (EXCE L, PRIMEIRA VISITA, PRIMEIRA VISITA_PROFISSIONAL) ou têm problema de qualidade de dado, ou mapeamento quebrado, ou valor marginal — ficam registrados aqui como decisão consciente de não importar, não como pendência esquecida.

---

## 5. O que fica fora desta rodada

- Import de Profissionais/Produtos/Serviços (mesma mecânica, não pedido agora).
- Qualquer tentativa de importar histórico de venda/agendamento/comissão do AZ (confirmado necessário na prática — seção 4.2).
- Parsing de `.FDB` (não há arquivo desse tipo disponível hoje).
- Endpoint HTTP permanente de varredura de pasta arbitrária no servidor — avaliado e descartado conscientemente (seção 4.2): risco de exposição (leitura de arquivo arbitrário) desproporcional a uma necessidade de análise pontual, resolvida com um script descartável.
- Os 3 arquivos "quase-cadastro" com problema de qualidade/mapeamento/valor marginal (seção 4.2) — decisão consciente de não importar, não pendência.
- Decisão final sobre os itens "menos claro-cut" da higienização (seção 1.3) — aguardando Renato.

---

## 6. Cliente novo direto na Agenda + seletor de cliente pesquisável (pedido original + achado durante a execução)

Pedido original: permitir cadastrar um cliente novo sem sair da tela de agendamento. Implementado (`appointment-form.tsx` + `client-picker-dialog.tsx` + reuso de `ClientForm`), mas o teste real revelou um bug de escala: o `<Select>` nativo usado pra escolher cliente virou impraticável com 7286 clientes reais (5+ segundos só pra abrir, e sob essa carga o valor selecionado às vezes "voltava" sozinho segundos depois — confirmado com log, não é boato). Isso não é uma pendência separada da tela de busca (que já estava registrada como próxima rodada) — é a mesma causa raiz, então foi resolvida junto: novo componente `ClientPickerDialog` (busca por nome/telefone, sem lib nova, nunca renderiza mais que 30 resultados de uma vez) substitui o Select em `appointment-form.tsx`. Avaliado se valeria a pena replicar pra Profissionais/Serviços/Produtos agora - **não**, esses têm 1 a 3 registros hoje, o Select simples continua adequado; revisitar só se o volume crescer.

Durante o mesmo diagnóstico, achado e corrigido um segundo bug: `createClient` chama `revalidatePath("/clientes")`, e isso aciona um refresh automático do Next.js na rota atual mesmo quando o form de cliente está embutido dentro de outro form (agendamento) — o refresh remonta o form pai e perde a seleção recém-feita. Corrigido com um parâmetro opcional (`skipRevalidate`/`skipRefresh`) usado só nesse fluxo embutido; o cadastro normal em `/clientes` continua revalidando normalmente.

---

## 7. Admin: excluir/reverter dados com integridade preservada (pedido ampliado por Renato durante a execução)

Pedido original era mais estreito (reverter import); Renato pediu explicitamente ampliar: escolha individual de qual cliente excluir (não só reverter um job inteiro), aplicável a qualquer cliente (não só os importados), com verificação de todo o histórico vinculado (venda, pagamento, agendamento, faturamento, comissão), alerta com recomendação antes de confirmar, nota de auditoria no registro preservado, caminho de reativação, e pré-validação de duplicata também no cadastro manual (não só no import).

**Migration real aplicada** (aprovação explícita obtida antes): `Client.importJobId` (nullable, FK pra `MigrationJob`, `ON DELETE SET NULL`) — rastreia qual import trouxe cada cliente, sem servir de mecanismo de revert em si (a exclusão é sempre por registro escolhido, não por job).

**Achado de infraestrutura durante a aplicação:** a role de runtime da API (`insightlab_app`) não é dona das tabelas — só tem DML, sem DDL. `prisma migrate deploy` com as credenciais normais falhou (`must be owner of table Client`). Migration aplicada via a role owner (`insightlab`) direto no container, e o estado do Prisma (`_prisma_migrations`) foi realinhado com `migrate resolve`. Isso é uma boa prática de segurança já existente no projeto (least-privilege runtime role) — só documentando aqui porque não estava óbvio até bater nesse erro; migrations futuras vão precisar do mesmo caminho.

**Lógica de exclusão** (`clients.service.ts` `getDeleteImpact`/`remove`):
- Conta histórico vinculado direto (`appointments`, `attendances`, `whatsAppMessages`, `sales`) — `Payment`/`Commission`/`FiscalDocument` não têm FK direta pra `Client` (só via `Sale.saleId`), então a regra de segurança já fica coberta só checando `sales > 0`; os números completos (via as vendas do cliente) aparecem no alerta só pra dar o racional completo, não pra decidir.
- **Zero histórico → exclusão real** (`prisma.client.delete`).
- **Qualquer histórico → nunca exclui de verdade** — desativa (`status: INACTIVE`) e grava uma nota carimbada no campo `notes` ("Cliente excluído em DATA/HORA por FULANO - desativado porque tem histórico..."), preservando o texto de nota anterior. Reversível trocando o status de volta pra Ativo (endpoint `PATCH` já existente, nenhum endpoint novo precisou ser criado pra isso).
- Reavalia tudo no servidor no momento da exclusão - nunca confia no que a tela já mostrou (mesmo padrão de defesa em profundidade do commit de import).

**Dedup no cadastro manual:** `POST /v1/clients` agora rejeita (409, com o nome do cliente existente e recomendação) telefone duplicado, comparando dígito a dígito (ignora formatação) - mesma lógica já usada no import, agora também no cadastro manual direto.

**Permissão:** `clients.delete`, nova, adicionada só ao Admin (excluída explicitamente da lista do Gerente) - "apenas admin" foi requisito explícito de Renato.

**UI:** botão "Excluir" em `/clientes` (lista) e `/clientes/[id]` (detalhe), com `AlertDialog` que busca o impacto antes de mostrar a confirmação - mensagem muda conforme o resultado (exclusão definitiva vs. desativação com recomendação e contagem completa do histórico).

**Validação:** `tsc`/`pnpm build` limpos (web + api), 17 testes novos em `clients.service.spec.ts` (dedup, impacto, exclusão real, desativação com nota, preservação de nota anterior, fallback de nome→email), suíte completa do backend (300 testes, 1 flake de bcrypt já confirmado ambiental) verde. Validado ao vivo via Playwright: exclusão real de 6 clientes de teste (criados durante o diagnóstico do item 6, sem histórico - serviu de limpeza real dos dados de teste), e dedup bloqueando corretamente um telefone duplicado com formatação diferente (`(41) 99977-2609` vs `41999772609` já cadastrado). O caminho de desativação-com-histórico não foi clicado ao vivo contra dado real pra não mexer em clientes de fixture compartilhados com outros fluxos de teste (Cliente Teste Audit, Cliente Publico Teste etc.) - fica coberto pelos 3 testes unitários dedicados a esse cenário.

---

*Documento gerado por Claude Code a pedido de Renato, em 31/07/2026.*
