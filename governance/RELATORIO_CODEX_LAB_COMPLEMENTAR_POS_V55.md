# RELATORIO CODEX LAB COMPLEMENTAR POS-V55

## Status final

APROVADO COM OBSERVACOES

## Ambiente utilizado

- API Lab: http://localhost:4001
- Banco Lab: insightlab_one_codex_lab em localhost:5434
- Redis: localhost:6379

## Isolamento

- Nao houve uso de http://localhost:4000
- Nao houve uso de localhost:5433
- Nao houve uso do banco canonico insightlab_one
- Nao houve retry without sandbox
- Nao houve alteracao de codigo, schema, migrations, seed, auth, permissions, guards ou decorators
- Nao houve commit
- Nao houve push

## Validacao 403

Resultado: 403 NAO VALIDADO.

Motivo:
- Nao havia usuario restrito real utilizavel no Lab sem alterar seed, roles ou permissoes.
- Apenas admin@mix-demo.local foi encontrado como usuario ativo.
- O usuario encontrado possui role ADMIN e permissoes amplas.

Conclusao:
- O cenario 403 permanece como gap governado.
- Nao foi forcada criacao artificial de usuario restrito.

## Validacao de disponibilidade livre

Resultado: VALIDADA.

Dados utilizados:
- Usuario: admin@mix-demo.local
- professionalId: cmngaoxl00001qwf1edgm9sux
- Slot: weekday=2, 07:00-08:00
- availabilityId criado: cmoxd1b2q000wbpcbf1tjvx2n

Evidencias:
- POST /v1/availability retornou 201
- GET apos criacao retornou totalRules=1
- PATCH active=false retornou 200
- GET apos inativacao retornou totalRules=0
- Nenhuma disponibilidade ativa residual ficou aberta apenas para teste

## Conclusao executiva

A rodada complementar pos-V55 cumpriu o objetivo funcional de disponibilidade livre e confirmou a limitacao governada do cenario 403.

Classificacao final: APROVADO COM OBSERVACOES
