# INSIGHTLAB ONE — CODEX LAB COM EXECUÇÃO AUTOMATIZADA CONTROLADA

Você está atuando no projeto InsightLab One.

## 1. CONTEXTO

Existe uma separação operacional validada:

AMBIENTE CANÔNICO — PROTEGIDO:
- API: http://localhost:4000
- Banco: postgresql://insightlab:insightlab123@localhost:5434/insightlab_one?schema=public

AMBIENTE LAB — PERMITIDO PARA TESTES MUTÁVEIS:
- API_LAB_URL: http://localhost:4001
- DATABASE_URL: postgresql://insightlab:insightlab123@localhost:5434/insightlab_one_codex_lab?schema=public

AMBIENTE HISTÓRICO — SOMENTE REFERÊNCIA:
- localhost:5433 / pg_old_inspect

O ambiente Lab é clone descartável/controlado da base canônica. Portanto, ações mutáveis são permitidas SOMENTE no Lab.

## 2. MISSÃO

Automatizar ao máximo a validação do fluxo operacional mínimo do MVP no ambiente Lab:

appointment -> attendance -> sale -> payment -> cash-register -> commission -> fiscal-document

Objetivo:
- acelerar readiness de go-live;
- validar fluxo ponta a ponta;
- identificar falhas reais de contrato, payload, regra de negócio ou integração entre módulos;
- registrar evidências;
- não alterar o ambiente canônico.

## 3. FONTES OBRIGATÓRIAS

Antes de agir, leia:

1. AGENTS.md
2. RUN-SUMMARY.md
3. docs/llm/InsightLab_One_Documento_Mestre_V53.txt
4. docs/codex/CODEX_LAB_CONTROLADO_PROMPT.md, se existir
5. git status --short --branch
6. configurações Codex locais, se existirem:
   - ~/.codex/config.toml
   - .codex/config.toml
   - arquivos .codex*

## 4. PERMISSÕES NO LAB

Você PODE executar no ambiente Lab:

### 4.1 Diagnóstico
- ler arquivos;
- inspecionar controllers, DTOs, services e schema;
- consultar logs;
- rodar GETs read-only na API Lab;
- consultar banco Lab via SELECT.

### 4.2 Chamadas HTTP mutáveis
Você PODE executar chamadas mutáveis contra http://localhost:4001:

- POST /v1/appointments
- POST /v1/attendances
- POST /v1/attendances/:id/start
- POST /v1/attendances/:id/in-progress
- POST /v1/attendances/:id/finish
- POST /v1/sales
- POST /v1/sales/:id/items
- POST /v1/sales/:id/recalculate
- POST /v1/sales/:id/ready-for-checkout
- POST /v1/payments
- POST /v1/payments/:id/mark-paid
- POST /v1/cash-register/open
- POST /v1/cash-register/:id/close
- POST /v1/commissions/generate
- POST /v1/commissions/:id/release
- POST /v1/commissions/:id/block
- POST /v1/fiscal-documents
- POST /v1/fiscal-documents/:id/status

### 4.3 SQL no Lab
Você PODE executar SQL diretamente SOMENTE no banco:

insightlab_one_codex_lab

Permitido:
- SELECT;
- INSERT;
- UPDATE;
- criação de massa auxiliar;
- ajuste de massa de teste;
- consultas de contagem;
- consultas de evidência;
- marcação de registros com identificador da rodada;
- limpeza controlada de registros da rodada.

Condição:
- sempre usar marcador único da rodada;
- nunca afetar registros sem marcador quando a operação for UPDATE/DELETE;
- preferir API primeiro;
- usar SQL direto quando a API não permitir preparar ou limpar massa necessária.

### 4.4 Arquivos de evidência
Você PODE criar/atualizar arquivos somente nestes caminhos:

- .codex-runs/
- governance/
- docs/codex/

Finalidade:
- registrar plano;
- registrar execução;
- registrar evidências;
- registrar IDs criados;
- registrar riscos;
- registrar resultado final.

## 5. PROIBIÇÕES ABSOLUTAS

Você NÃO PODE:

1. usar http://localhost:4000;
2. usar localhost:5433;
3. usar o banco insightlab_one;
4. alterar dados canônicos;
5. alterar volumes Docker;
6. apagar containers;
7. apagar volumes;
8. rodar docker rm;
9. rodar docker volume rm;
10. rodar prisma migrate;
11. criar migration;
12. alterar schema.prisma;
13. alterar seed principal;
14. alterar autenticação/autorização/guards;
15. alterar código de core sem aprovação explícita;
16. alterar fiscal-documents no código sem aprovação explícita;
17. fazer commit;
18. fazer push;
19. instalar dependências;
20. alterar configuração global do Codex;
21. usar API_URL=http://localhost:4000;
22. usar DATABASE_URL apontando para insightlab_one.

Se detectar qualquer comando, env, URL ou conexão envolvendo 4000, 5433 ou insightlab_one, pare e reporte bloqueio.

## 6. POLÍTICA DE AUTONOMIA

Como o ambiente Lab é clonado e descartável, você está autorizado a executar automaticamente:

- login na API Lab;
- GETs de diagnóstico;
- POSTs/PATCHs necessários ao fluxo mínimo;
- SELECTs no banco Lab;
- INSERTs no banco Lab;
- UPDATEs no banco Lab;
- limpeza controlada de registros criados nesta rodada;
- geração de relatório de evidência.

Você deve NÃO pedir aprovação para cada chamada HTTP ou SQL no Lab, desde que:
- esteja usando http://localhost:4001;
- esteja usando banco insightlab_one_codex_lab;
- esteja usando marcador único;
- esteja registrando os IDs criados;
- esteja respeitando as proibições absolutas.

Você deve pedir aprovação antes de:
- alterar código;
- alterar schema;
- rodar migration;
- alterar seed;
- mexer em auth/permissions;
- mexer em fiscal-documents no código;
- apagar dados fora do marcador da rodada;
- alterar qualquer arquivo fora de .codex-runs, governance ou docs/codex.

## 7. MARCADOR OBRIGATÓRIO

Antes de executar o fluxo, gere um marcador único:

codexlab_YYYYMMDD_HHMMSS

Use esse marcador em:
- nomes;
- notes;
- sourceId;
- referenceNumber;
- accessKey;
- arquivos de evidência;
- comentários operacionais quando possível.

Nenhum registro de teste deve ser criado sem marcador rastreável quando o payload permitir.

## 8. CHECKPOINT INICIAL OBRIGATÓRIO

Antes do fluxo mutável, execute e registre:

1. git status --short --branch
2. curl -i http://localhost:4001/v1/clients
   - esperado: 401 sem token
3. login em http://localhost:4001/v1/auth/login
   - usuário: admin@mix-demo.local
   - senha: Admin@12345
4. token Lab gerado
5. GET http://localhost:4001/v1/clients com Bearer
   - esperado: 200
6. GET rotas principais:
   - /v1/clients
   - /v1/professionals
   - /v1/services-catalog
   - /v1/appointments
   - /v1/attendances
   - /v1/sales
   - /v1/payments
   - /v1/cash-register
   - /v1/commissions
   - /v1/fiscal-documents
7. confirmar que NÃO está usando localhost:4000
8. confirmar que NÃO está usando localhost:5433
9. confirmar que o banco alvo é insightlab_one_codex_lab

## 9. EXECUÇÃO ESPERADA

Execute no Lab, preferencialmente via API:

1. login;
2. leitura da massa mínima;
3. abrir caixa, se necessário;
4. criar appointment com marcador;
5. criar attendance vinculada;
6. transicionar attendance até FINISHED;
7. criar sale;
8. adicionar item à sale;
9. recalcular sale;
10. marcar sale ready-for-checkout;
11. criar payment;
12. marcar payment como pago;
13. gerar commission;
14. criar fiscal-document;
15. transicionar fiscal-document:
    - DRAFT -> REQUESTED
    - REQUESTED -> AUTHORIZED
16. validar GET final das entidades criadas;
17. registrar relatório.

Se algum passo falhar:
- registre comando;
- registre payload;
- registre HTTP status;
- registre response body;
- registre hipótese;
- tente no máximo uma correção de payload baseada em contrato lido;
- não altere código para fazer passar;
- se exigir código/schema/migration, pare e reporte bloqueio.

## 10. SQL DIRETO NO LAB

SQL direto é permitido no Lab para:

- inspecionar dados;
- buscar IDs;
- confirmar contagens;
- preparar massa auxiliar;
- corrigir massa de teste criada na rodada;
- limpar registros criados na rodada.

Regra para UPDATE/DELETE:
- somente registros associados ao marcador da rodada;
- se não houver marcador rastreável, não faça UPDATE/DELETE;
- prefira rollback por descarte do banco Lab ou restauração do dump.

## 11. ROLLBACK / LIMPEZA

Ao final, apresente uma das opções:

### Opção A — manter evidência
Manter os dados criados no Lab para inspeção.

### Opção B — limpeza controlada
Limpar somente registros criados na rodada, usando marcador.

### Opção C — reset do Lab
Recomendar restauração do dump original no banco insightlab_one_codex_lab.

Não execute reset do banco Lab sem informar claramente a ação.

## 12. ARQUIVO DE EVIDÊNCIA

Crie um relatório em:

governance/RELATORIO_CODEX_LAB_FLUXO_MINIMO_YYYYMMDD_HHMMSS.md

O relatório deve conter:

1. data/hora;
2. marcador;
3. ambiente usado;
4. confirmação de que usou somente 4001;
5. confirmação de que usou somente insightlab_one_codex_lab;
6. comandos principais;
7. payloads principais;
8. IDs criados;
9. respostas HTTP principais;
10. status final de appointment;
11. status final de attendance;
12. status final de sale;
13. status final de payment;
14. status final de cash-register;
15. status final de commission;
16. status final de fiscal-document;
17. riscos;
18. pendências;
19. recomendação final:
    - APROVADO
    - APROVADO COM RESSALVAS
    - ABORTADO

## 13. SAÍDA FINAL OBRIGATÓRIA

Ao final, responda com:

1. objetivo;
2. ambiente usado;
3. o que foi feito;
4. arquivos criados/alterados;
5. comandos executados;
6. IDs criados;
7. resultado por etapa;
8. erros encontrados;
9. evidências;
10. riscos;
11. pendências;
12. recomendação final;
13. próximo passo.

## 14. REGRA DE OURO

Automatize agressivamente dentro do Lab.

Proteja radicalmente o canônico.

Se houver dúvida entre velocidade e preservar o canônico, preserve o canônico.