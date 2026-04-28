# PLANO MINIMO R1.10 E3

## Objetivo da E3
- elevar a confianca automatizada minima da R1.10 sem expandir escopo funcional
- transformar o corte ja validado em E2 em evidencia repetivel sem depender de runtime
- cobrir o comportamento minimo ja existente de `products`, `supplies`, `resources` e `unit-conversions` com testes pequenos, localizados e reversiveis

## Leitura objetiva do estado atual
- a baseline vigente local parte da V48 e a R1.11a permanece preservada como frente estrutural de readiness/go-live
- a R1.10 foi aberta de forma correta por leitura incremental apos o fechamento verde da rodada pos-V48
- a R1.10.E2 fechou com smoke manual aprovado em runtime real para:
  - `POST` e `GET /v1/products`
  - `POST` e `GET /v1/supplies`
  - `POST` e `GET /v1/resources`
  - `POST` e `GET /v1/unit-conversions`
- os quatro modulos ja estao ligados na API e expostos por controller, service e module
- os quatro services implementam apenas o corte minimo de `findAllByTenant` e `create`
- os DTOs atuais aceitam apenas o subconjunto minimo necessario para o smoke
- o schema Prisma ja preve campos e relacoes mais amplos que ainda nao sao exercitados por esse corte minimo:
  - `Product`: `categoryId`, `description`, `stockQuantity`, `minStock`, `status`
  - `SupplyItem`: `categoryId`, `sku`, `description`, `stockQuantity`, `minStock`, `status`
  - `OperationalResource`: relacao com `appointments` e `blocks`
  - `UnitConversion`: dependencia explicita de `supplyItemId`
- os testes automatizados hoje sao muito rasos:
  - `products.service.spec.ts`: apenas `should be defined`
  - `supplies.service.spec.ts`: apenas `should be defined`
  - `resources.service.spec.ts`: apenas `should be defined`
  - `unit-conversions.service.spec.ts`: apenas `should be defined`

## Lacunas reais
- falta evidencia automatizada de que cada service aplica corretamente o filtro por `tenantId`
- falta evidencia automatizada de que cada `create` encaminha exatamente os campos minimos esperados para o Prisma
- falta evidencia automatizada de que `unit-conversions` depende do `supplyItemId` no contrato atual, sem mascarar a vinculacao obrigatoria
- falta blindagem contra regressao silenciosa no mapeamento entre DTOs minimos e persistencia
- o smoke da E2 valida trilho operacional, mas nao substitui testes automatizados pequenos e repetiveis

## Menor incremento seguro recomendado
- implementar somente testes automatizados minimos nos specs ja existentes da R1.10
- foco do incremento:
  - validar `findAllByTenant` com mock de Prisma e assercao do `where: { tenantId }`
  - validar `create` com mock de Prisma e assercao do payload persistido em cada modulo
  - manter o corte restrito a comportamento ja existente, sem criar endpoint novo, sem alterar DTO, sem alterar schema e sem ampliar regra de negocio
- recomendacao de corte da E3:
  - `products.service.spec.ts`: teste de listagem por tenant + teste de criacao com `name`, `sku`, `salePrice`, `cost`
  - `supplies.service.spec.ts`: teste de listagem por tenant + teste de criacao com `name`, `baseUnit`, `operationalUnit`, `unitCost`
  - `resources.service.spec.ts`: teste de listagem por tenant + teste de criacao com `name`, `type`, `description`
  - `unit-conversions.service.spec.ts`: teste de listagem por tenant + teste de criacao com `supplyItemId`, `fromUnit`, `toUnit`, `factor`, `roundingRule`
- evidencia esperada da etapa:
  - `pnpm lint` verde
  - `pnpm test` verde
  - sem runtime
  - sem seed nova
  - sem dado real novo

## O que NAO fazer agora
- nao abrir `update`, `delete`, `findOne`, paginacao ou filtros adicionais
- nao adicionar movimentacao de estoque, baixa por consumo, compra, lote, fornecedor ou reconciliacao financeira
- nao expandir DTOs para cobrir todos os campos do schema
- nao mexer em schema, migration, auth, fiscal, CI/CD ou contratos amplos
- nao tentar converter a E3 em hardening completo de dominio
- nao tratar o smoke da E2 como motivo para inflar a R1.10 com integracoes cruzadas

## Criterios de pronto da E3
- os quatro specs da R1.10 deixam de ser meramente declarativos
- cada spec cobre ao menos:
  - um teste de listagem por tenant
  - um teste de criacao com o payload minimo do modulo
- os testes usam mock explicito de Prisma, sem runtime e sem acesso ao banco
- `pnpm lint` em `services/api` permanece executavel e verde
- `pnpm test` em `services/api` permanece executavel e verde
- a etapa gera registro objetivo do que foi coberto e do que continua deliberadamente fora do corte

## Proximo bloco operacional recomendado
- executar a R1.10.E3 como bloco de automacao minima sem tocar em dominio
- se a E3 fechar verde, abrir uma etapa seguinte apenas para decidir entre:
  - manter a R1.10 no corte minimo aprovado para MVP
  - ou adicionar uma camada minima de cenarios negativos estritamente nos testes, sem expandir endpoint nem schema

## Leitura multiagente minima consolidada
- o que ganhamos:
  - confianca automatizada minima sobre a retaguarda ja exposta
  - menor risco de regressao silenciosa nos quatro modulos-base da R1.10
  - evidencia repetivel sem depender de runtime
- o que arriscamos:
  - confundir melhora de testes com maturidade funcional completa
  - gastar mais do que o necessario se a etapa sair do corte minimo
- o que adiamos:
  - cobertura funcional mais profunda
  - integracoes cruzadas de estoque, compras e financeiro
  - hardening amplo de dominio
- o que pode ir para R1.1 / R2:
  - ampliacao de CRUD
  - categorias, estoque minimo operacional e movimentos
  - relatorios, conciliacao e automacoes nao bloqueantes
- o que nao pode passar despercebido:
  - o schema ja e mais rico que o contrato exercitado hoje
  - `unit-conversions` depende de `supplyItemId`, portanto qualquer evolucao posterior precisa respeitar essa ancora
  - a E3 deve reforcar evidencia, nao redefinir escopo
- recomendacao de corte:
  - aprovar a E3 como automacao minima dos quatro services, sem runtime e sem alteracao de codigo de dominio
