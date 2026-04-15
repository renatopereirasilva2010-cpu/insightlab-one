# REGISTRO DE ABERTURA DA JANELA DE PILOTO / GO-LIVE CONTROLADO

## 1. Identificação da rodada
- Data: 2026-04-15
- Hora: 16:05
- Ambiente: WSL local + Docker ativo + workspace InsightLab One
- Janela vinculada: `governance/PILOTO_GO_LIVE_CONTROLADO.md`
- Frente ativa: R1.11a
- Baseline funcional preservada: R1.8.x

## 2. Responsável pela execução
- Nome: Renato Pereira da Silva
- Contato: 41997343519

## 3. Responsável pela decisão final
- Nome: Renato Pereiora da Silva
- Contato: 41997343519

## 4. Evidências mínimas usadas como base
- `AGENTS.md`
- `RUN-SUMMARY.md`
- `READINESS-R1.11a.md`
- `governance/PILOTO_GO_LIVE_CONTROLADO.md`

## 5. Critério objetivo de abertura desta rodada
- Usar esta janela apenas para piloto controlado no escopo mínimo já validado do MVP
- Não usar esta janela para expansão funcional, hardening adicional, mudança estrutural ou reabertura técnica da R1.11a
- Abrir a rodada somente com:
  - responsável pela execução identificado nominalmente
  - responsável pela decisão final identificado nominalmente
  - evidências mínimas aceitas disponíveis e rastreáveis

## 6. Baseline operacional repetível desta rodada
- Login
- Leitura autenticada de `clients`
- Leitura autenticada da massa mínima necessária ao piloto
- Criação de `appointment`
- Criação de `attendance`
- Transição `attendance OPEN -> IN_PROGRESS -> FINISHED`
- Criação de `fiscal-document`
- Transição fiscal `DRAFT -> REQUESTED -> AUTHORIZED`

## 7. Decisão de abertura da rodada
- [ ] APROVADO
- [x] APROVADO COM RESSALVAS
- [ ] ABORTADO

## 8. Ressalvas objetivas, se houver
- A abertura operacional depende do preenchimento nominal do responsável pela execução
- A abertura operacional depende do preenchimento nominal do responsável pela decisão final
- O corte atual é suficiente para piloto controlado, não para ampliação de escopo
- Qualquer necessidade de mexer em produto, infraestrutura, runtime ou dados extrapola esta rodada documental e deve ser tratada fora desta governança mínima

## 9. Observações operacionais da rodada
- Esta rodada usa como base o corte já validado anteriormente
- Não houve reabertura de diagnóstico técnico nesta etapa
- Este registro serve como gate documental mínimo para abertura assistida da janela de piloto / go-live controlado

## 10. Rollback manual mínimo de referência
- Interromper novas operações da rodada
- Preservar a baseline funcional já validada
- Não tocar em produto, schema, migrations, seeds ou módulos fiscais estabilizados
- Usar como referência de retorno:
  - `RUN-SUMMARY.md`
  - `READINESS-R1.11a.md`
  - `governance/PILOTO_GO_LIVE_CONTROLADO.md`

## 11. Encerramento do registro
- Responsável pelo registro: Renato Pereira da Silva
- Data/hora do registro: 2026-04-15 16:08
