# REGISTRO DE CONGELAMENTO — R1.10 NO CORTE MVP

- Data: 2026-04-28
- Frente: R1.10 — Estoque, Compras, Suprimentos Integrados e Estrutura Financeira Assistida
- Decisão: R1.10 congelada no corte mínimo atual para MVP

## 1. Objetivo deste registro
Formalizar que a R1.10 fica congelada no corte mínimo aprovado para o MVP, sem abertura imediata de novos cenários negativos, sem expansão de domínio e sem inclusão de compras, movimentação de estoque, baixa por consumo, fornecedores ou integração financeira avançada nesta rodada.

## 2. Base validada antes do congelamento
A R1.10 possui, até este ponto, evidência mínima sobre os quatro services-base:
- products
- supplies
- resources
- unit-conversions

A frente foi validada em duas camadas:
- smoke mínimo em runtime na R1.10.E2
- automação mínima de services na R1.10.E3

## 3. Evidência técnica consolidada
A validação pós-Codex da R1.10.E4 confirmou:
- `pnpm lint` em `services/api`: OK
- teste focal dos quatro specs da E3: OK
- resultado focal: 4 suítes / 12 testes verdes

Specs cobertos:
- `services/api/test/products.service.spec.ts`
- `services/api/test/supplies.service.spec.ts`
- `services/api/test/resources.service.spec.ts`
- `services/api/test/unit-conversions.service.spec.ts`

## 4. Decisão de corte
Fica decidido:
- congelar a R1.10 no corte mínimo atual para MVP
- não adicionar cenários negativos agora
- não ampliar CRUD
- não abrir compras/procurement
- não abrir movimentação de estoque
- não mexer em schema, migrations, auth, fiscal, CI/CD ou runtime
- mover ampliações não bloqueantes para R1.1 / R2

## 5. Justificativa executiva
O corte atual já entrega evidência suficiente para reduzir risco mínimo dos quatro módulos-base sem sequestrar o foco do MVP.

Adicionar mais cobertura agora teria ganho marginal menor do que o custo de atrasar as próximas frentes realmente críticas para disponibilização do produto.

## 6. Riscos aceitos
- a cobertura ainda é mínima e não representa maturidade completa de domínio
- não há cobertura de update, delete, findOne, paginação, filtros, cenários negativos ou integrações cruzadas
- o schema é mais rico que o contrato atualmente exercitado
- compras, estoque real, baixa por consumo e suprimentos avançados permanecem fora deste corte

## 7. Próximo passo recomendado
Atualizar o Documento-Mestre para refletir:
- fechamento formal da R1.10.E3
- validação pós-Codex da R1.10.E4
- congelamento da R1.10 no corte mínimo MVP
- recomendação de retomada da próxima frente sem reabrir a R1.10, salvo evidência nova
