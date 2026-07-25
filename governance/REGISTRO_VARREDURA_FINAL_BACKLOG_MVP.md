# REGISTRO — VARREDURA FINAL DO BACKLOG MVP ANTES DO FRONTEND

## 1. Objetivo

Antes de iniciar o frontend, varredura completa pra confirmar se restava alguma ONDA/ETAPA mapeada ou lacuna real de escopo que inviabilizasse o MVP.

## 2. Fontes checadas

- Código: busca por `TODO`/`FIXME`/`not implemented` em todo `services/api/src`.
- `docs/fase-status.md` e `docs/project-phase-status.md` (divergentes entre si — o segundo está desatualizado, referenciando Fase 5 enquanto o projeto já está na Fase 8; tratado como não-autoritativo).
- `docs/coverage-gate-etapa{1,2,3}.md` — únicos arquivos com itens "Ainda pendente" reais, não apenas checklist vazio.
- `docs/onda7-acceptance-checklist.md` e afins — checkboxes todos desmarcados, mas tratados como templates nunca preenchidos, não como lacunas reais (funcionalidade correspondente já validada via Codex Lab e testes ao vivo desta sessão).

## 3. Achados reais e ações tomadas

| Achado | Ação |
|---|---|
| `AuditLog` só tinha TODO, nunca gravava | Implementado `AuditLogService` + `AuditInterceptor` real, testado local e em staging |
| `Commission.status = CANCELED` existia no enum mas nunca era setado ("estorno de comissão" pendente) | Implementado `cancel()` (PENDING/BLOCKED → CANCELED; rejeita RELEASED, que exigiria estorno financeiro — decisão de domínio separada, fora de escopo agora) |
| CI (`pr-check.yml`) tinha `\|\| true` em todo passo — nunca falhava de verdade | Removido; escopado o audit pra `--prod` (bate com o trabalho de segurança real desta sessão) |
| `lodash` com CVE alta via `@nestjs/config` | Corrigido via `pnpm.overrides`, mesmo padrão do `multer` anterior |
| "Migração assistida com parsing real de FDB/CSV/XLSX" pendente | Confirmado: já é decisão explícita da seção 2.3 do adendo — pós-piloto, não MVP. Não é lacuna, é escopo corretamente adiado |
| "Enforcement fino de privilégios master" pendente | Checado no código: `admin-master` já tem permissão granular por ação (`read`, `migration.create`, `migration.import`, `migration.reconcile`). Nota estava desatualizada |
| "Onda 8 / Etapa 3 — piloto controlado, hardening, rollout inicial" | Não é lacuna de código — é a fase de execução do piloto real, que depende do frontend existir. Não tem checklist próprio (nunca foi formalizada), consistente com essa leitura |

## 4. Conclusão

Não restam ONDA/ETAPA mapeadas nem lacunas de escopo que bloqueiem o MVP no backend. Os itens de "hardening"/"piloto" restantes dependem do frontend existir para serem executados de fato.

## 5. Decisão

Autorizado avançar para planejamento e implementação do frontend.
