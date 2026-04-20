# R1.11a Readiness E Rollback Minimo

## Escopo
- frente ativa: R1.11a
- baseline funcional preservada: R1.8.x
- objetivo deste arquivo: consolidar checklist operacional minimo, smoke reproduzivel e rollback minimo sem expandir escopo

## Mapa operacional oficial
- raiz:
  - `pnpm build`
  - `pnpm test`
  - `pnpm lint`
- `services/api`:
  - `pnpm build`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm start`
  - `bash scripts/smoke-runtime-min.sh`

## Checklist de readiness minimo
- build repo-wide executa: validado anteriormente
- test repo-wide executa: validado anteriormente
- lint repo-wide executa: validado anteriormente
- build de `services/api` executa: validado nesta etapa
- lint de `services/api` executa: validado no ambiente real atual
- test de `services/api` executa: validado no ambiente real atual com `25` suites / `55` testes verdes
- boot de `services/api` sobe ate escuta HTTP: validado no ambiente real atual
- smoke minimo reproduzivel existe: validado nesta etapa
- smoke minimo executa sem ambiguidade: validado
- validacao HTTP minima autenticada: validada
- dependencia critica de runtime identificada: nenhuma bloqueando o ambiente real atual
- rollback minimo documentado: validado nesta etapa
- readiness minimo da R1.11a: VERDE para piloto/go-live controlado no corte aprovado

## Smoke minimo reproduzivel
- comando:
  - `cd services/api && bash scripts/smoke-runtime-min.sh`
- criterio de sucesso:
  - processo sobe
  - responde em `http://127.0.0.1:4000/v1/clients`
- criterio de validacao minima atual:
  - `POST /v1/auth/login`: `201 Created`
  - `GET /v1/clients` com Bearer token: `200 OK` com dados reais

## Massa minima funcional do MVP
- autenticacao operacional:
  - login responde com criacao de sessao/token
- acesso autenticado ao core minimo:
  - rota `GET /v1/clients` com Bearer token responde `200 OK`
- dados reais acessiveis:
  - retorno autenticado contem dados reais do ambiente
- trilha minima repetivel:
  - `pnpm lint` em `services/api`
  - `pnpm test` em `services/api`
  - validacao HTTP minima autenticada

## Corte operacional de piloto / go-live controlado
- corte aprovado desta etapa:
  - API sobe no ambiente real
  - autenticacao minima funciona
  - lint de `services/api` executa
  - test de `services/api` executa com `25` suites / `55` testes verdes
  - leitura autenticada de dados reais funciona
  - a trilha repetivel minima executa de forma estavel
- este corte habilita:
  - piloto controlado
  - validacao assistida com cliente/piloto em escopo MVP
- este corte nao habilita ainda:
  - expansao funcional
  - endurecimento de lint semantico completo
  - promocao para go-live ampliado sem nova rodada de readiness

## Evidencia objetiva desta etapa
- o artefato compilado `dist/src/main.js` inicializa o Nest e registra rotas
- o runtime de `services/api` foi validado no ambiente real do WSL
- o lint de `services/api` esta OK no ambiente real atual
- o test de `services/api` esta OK no ambiente real atual com `25` suites / `55` testes verdes
- evidencias HTTP atuais:
  - `POST /v1/auth/login`: `201 Created`
  - `GET /v1/clients` com Bearer token: `200 OK` com dados reais
- o erro anterior de PostgreSQL indisponivel deve ser tratado como nao reproduzido no ambiente real atual
- o evento `EADDRINUSE` deve ser tratado apenas como ocorrencia operacional de segunda instancia concorrente na porta `4000`

## Riscos ativos
- o lint segue pragmatico via TypeScript e nao substitui uma malha completa de regras ESLint
- o corte atual e suficiente para piloto controlado, mas ainda nao representa hardening ampliado
- a expansao de readiness para go-live mais amplo deve continuar governada e sem expandir escopo

## Rollback minimo
- reverter apenas os artefatos operacionais desta etapa:
  - remover `services/api/scripts/smoke-runtime-min.sh`
  - remover `READINESS-R1.11a.md`
  - restaurar `RUN-SUMMARY.md` ao estado anterior se necessario
- nao tocar em schema, migrations ou modulos da R1.8.x

## Recomendacao de corte
- o runtime minimo esta validado no ambiente real atual
- readiness minimo desta frente: VERDE
- prosseguir com piloto/go-live controlado apenas apos repetir:
  - `pnpm lint` em `services/api`
  - `pnpm test` em `services/api`
  - validacao HTTP minima autenticada do fluxo:
    - `POST /v1/auth/login`
    - `GET /v1/clients` com Bearer token
