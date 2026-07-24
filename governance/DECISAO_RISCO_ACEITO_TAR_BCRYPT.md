# DECISÃO DE RISCO ACEITO — CADEIA `bcrypt` → `node-pre-gyp` → `tar`

## 1. Contexto

Auditoria de dependências (`pnpm audit --prod`, 24/07/2026) encontrou 1 vulnerabilidade crítica e 9 altas, todas na mesma cadeia transitiva:

```
bcrypt@5.1.1 > @mapbox/node-pre-gyp@1.0.11 > tar@6.2.1
```

São CVEs de path traversal / DoS no pacote `tar`, usado pelo instalador de binário nativo do `bcrypt` (`node-pre-gyp`).

## 2. Por que não bloqueia o MVP/R1

O `tar` vulnerável só é executado durante `pnpm install`, quando o `node-pre-gyp` baixa/compila o binário nativo do `bcrypt`. Ele nunca é carregado ou executado em runtime pela API. Explorar essas vulnerabilidades exigiria comprometer o registro npm ou fazer MITM durante a instalação — não um ataque via rede contra a aplicação rodando.

## 3. Decisão

Aceitar o risco residual por ora. Não forçar upgrade do `tar` via `pnpm.overrides` neste momento: o `node-pre-gyp@1.0.11` foi validado contra a versão atual do `tar`, e forçar outra versão arrisca quebrar silenciosamente a compilação do binário nativo do `bcrypt` — um problema de login/autenticação, bem mais grave que o risco de supply-chain que estaríamos mitigando.

## 4. O que não será feito agora

- Override de `tar` via `pnpm.overrides` (risco de quebrar a instalação nativa do bcrypt).
- Qualquer alteração no módulo de auth/hash de senha como reação a isto.

## 5. Encaminhamento futuro

Avaliar migração de `bcrypt` (binding nativo) para `bcryptjs` (implementação pura em JS, mesmo formato de hash, elimina `node-pre-gyp`/`tar` da árvore por completo). Isso remove a cadeia na raiz, mas mexe diretamente no caminho de autenticação — deve ser tratado como rodada dedicada, com teste de login/seed antes de qualquer merge, não como correção reativa de auditoria.

## 6. Classificação final (original)

RISCO ACEITO — sem exploração real via rede identificada. Reavaliar a cada checkpoint de segurança (seção 7 do adendo `insightlab-one-onda0-adendo-governanca.md`) ou se `node-pre-gyp`/`bcrypt` publicarem uma versão que resolva a cadeia sem quebrar a instalação nativa.

## 7. RESOLVIDO em 24/07/2026

O encaminhamento futuro da seção 5 foi executado: `bcrypt` (nativo) substituído por `bcryptjs` (pura JS, mesmo algoritmo/formato de hash). Elimina `node-pre-gyp`/`tar` da árvore por completo — a cadeia toda deixou de existir, não é mais risco aceito, é risco eliminado.

Compatibilidade confirmada: `bcryptjs` verifica corretamente hashes já existentes no banco (gerados pelo `bcrypt` nativo antigo) — nenhum usuário precisou re-hashear senha. Login testado ao vivo com `admin@mix-demo.local` (hash antigo) e `operador.restrito@mix-demo.local`, ambos funcionando.

`pnpm audit --prod`: 20 vulnerabilidades (1 crítica) → 8 (0 crítica). As 8 restantes são de dependências transitivas não relacionadas (lodash, qs, file-type, `@nestjs/core`) — registradas como item menor de follow-up, não bloqueante.
