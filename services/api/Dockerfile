# Build a partir da RAIZ do monorepo (nao de services/api):
#   docker build -f services/api/Dockerfile -t insightlab-one-api .
#
# Generico o bastante pra rodar em qualquer plataforma de container gerenciada
# (Render, Fly.io, Cloud Run, Fargate, Railway...) - nao trava fornecedor.
# Nao roda migration nem seed automaticamente no boot: isso continua sendo
# passo manual/gated (`npx prisma migrate deploy`), igual o resto do projeto.
#
# Base Debian slim (nao alpine): o binario do Prisma Query Engine depende de
# libssl, e a musl libc do alpine nao tem a versao certa por padrao. Mesmo no
# Debian, o `openssl` precisa estar instalado explicitamente - sem ele o
# Prisma nao detecta a versao real (3.0.x no bookworm) e tenta usar um
# binario pra 1.1.x, que nao existe na imagem.

FROM node:20-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/api/package.json services/api/package.json
RUN pnpm install --frozen-lockfile

COPY services/api services/api
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build
RUN pnpm deploy --filter api --prod /deploy/api

# `pnpm deploy` recria o node_modules do zero e perde o client do Prisma
# gerado acima (nao eh dependencia rastreada pelo lockfile, eh saida de
# comando). Gera de novo, agora direto dentro da pasta que sera copiada
# pro estagio final - usa o binario do prisma (devDependency) que ainda
# existe no node_modules original desta etapa de build.
WORKDIR /deploy/api
RUN /repo/services/api/node_modules/.bin/prisma generate
WORKDIR /repo

FROM node:20-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app && useradd -r -g app app
WORKDIR /app

COPY --from=build --chown=app:app /deploy/api/dist ./dist
COPY --from=build --chown=app:app /deploy/api/node_modules ./node_modules
COPY --from=build --chown=app:app /deploy/api/prisma ./prisma
COPY --from=build --chown=app:app /deploy/api/package.json ./package.json

USER app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
