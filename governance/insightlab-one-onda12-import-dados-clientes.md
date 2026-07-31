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

## 4. Import real dos dados do Mix

Zona Vermelha (dado de tenant real) — a própria tela de revisão é o mecanismo de confirmação explícita. Ver seção 5 do plano de execução: a importação real (se/quando executada) roda com Renato presente na tela de revisão antes do clique final de "Confirmar importação".

---

## 5. O que fica fora desta rodada

- Import de Profissionais/Produtos/Serviços (mesma mecânica, não pedido agora).
- Qualquer tentativa de importar histórico de venda/agendamento/comissão do AZ.
- Parsing de `.FDB` (não há arquivo desse tipo disponível hoje).
- Decisão final sobre os itens "menos claro-cut" da higienização (seção 1.3) — aguardando Renato.

---

*Documento gerado por Claude Code a pedido de Renato, em 31/07/2026.*
