# REGISTRO COMPLEMENTAR R1.10 E2

## Objetivo da etapa
- Materializar um artefato operacional minimo para validacao manual da R1.10 sem alterar codigo de dominio, schema, migracoes, autenticacao, fiscal ou CI/CD.
- Cobrir o fluxo HTTP basico de estoque e suprimentos com login administrativo, criacao minima e leitura final dos endpoints da frente.

## Arquivos gerados
- `services/api/scripts/smoke-r110-e2.sh`
- `governance/REGISTRO_COMPLEMENTAR_R1.10_E2.md`

## Ordem esperada de execucao manual
1. Garantir banco e API local ativos na baseline vigente, com a API respondendo em `http://localhost:4000`.
2. Entrar em `services/api`.
3. Executar `bash scripts/smoke-r110-e2.sh`.
4. Acompanhar os checkpoints de login, criacao de `product`, `supply`, `resource` e `unit-conversion`.
5. Confirmar as listagens finais de `/v1/products`, `/v1/supplies`, `/v1/resources` e `/v1/unit-conversions`.
6. Verificar o bloco `RESUMO FINAL` e o `SMOKE_STATUS`.

## Criterio de sucesso
- Login com `admin@mix-demo.local` / `Admin@12345` retorna token valido.
- As quatro criacoes retornam `200` ou `201` com `id` preenchido.
- As quatro listagens retornam `200`.
- O script encerra com `SMOKE_STATUS=PASS`.

## Riscos e limites do corte
- O artefato nao executa smoke automaticamente nesta etapa; ele apenas prepara a trilha manual repetivel.
- O script depende de `bash`, `curl` e `python3` estarem disponiveis no ambiente local.
- O corte valida apenas criacao e leitura minima dos endpoints da R1.10; nao cobre edicao, exclusao, concorrencia, consistencia cruzada, integracao fiscal ou hardening.
- A execucao gera dados reais de apoio no banco local com marcador unico e nao realiza limpeza automatica.
- Qualquer falha de permissao, seed, runtime ou contrato HTTP deve ser tratada como evidencia operacional da baseline atual, sem expandir escopo nesta etapa.
