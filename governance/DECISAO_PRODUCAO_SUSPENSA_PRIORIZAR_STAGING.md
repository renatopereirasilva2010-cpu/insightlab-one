# DECISÃO — PRODUÇÃO SUSPENSA, PRIORIZAR STAGING ATÉ MVP+FRONTEND PRONTOS

## 1. Contexto

Staging e produção foram colocados no ar (Render + Neon + Upstash) no mesmo dia, como validação do mecanismo de deploy. Ao testar os links, surgiu a pergunta correta de Renato: vale consumir recursos de produção antes de:
- fechar as releases restantes do MVP no backend;
- implementar o frontend (hoje não existe nenhum);
- validar tudo ponta a ponta em staging.

## 2. Decisão

**Produção suspensa** (`srv-d9i0ecvaqgkc73c8hof0`, via API do Render — não apaga nada, só para de rodar). Trabalho segue exclusivamente em **staging** (`insightlab-one-api-staging.onrender.com`) até:

1. Releases restantes do MVP mapeadas estarem concluídas no backend.
2. Frontend existir e estar integrado (hoje é só API, sem nada visual).
3. Validação ponta a ponta completa em staging (frontend + backend juntos).

Só então produção volta a ser reativada.

## 3. Justificativa

Produção rodando sem frontend e sem MVP completo não tem valor de uso real — ninguém consegue interagir com o sistema ainda. Manter os dois ambientes ativos cedo demais:
- consome cota de free tier sem necessidade;
- cria falsa sensação de "estamos em produção" antes de haver produto utilizável;
- antecipa infraestrutura à frente da prontidão real.

## 4. O que isso não muda

- Staging continua ativo e é onde toda validação futura acontece.
- Neon (staging + production branches), Upstash e o repositório GitHub continuam configurados e prontos — reativar produção é só `POST /v1/services/{id}/resume` na API do Render, sem reconfiguração.
- RLS, credenciais e demais itens de segurança registrados em `REGISTRO_RLS_POC_PAYMENT.md` e `DECISAO_RISCO_ACEITO_TAR_BCRYPT.md` continuam válidos e não foram afetados.

## 5. Classificação final

CONFIRMADO — produção suspensa em 25/07/2026, critério de reativação registrado acima.
