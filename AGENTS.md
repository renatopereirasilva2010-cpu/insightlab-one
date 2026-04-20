# AGENTS.md — InsightLab One

## 1. Origem e função deste arquivo
Este arquivo nasce diretamente do Documento-Mestre do projeto.
Ele existe para uso exclusivo do Codex e traduz a governança viva do projeto em regras operacionais executáveis pelo agente.

## 2. Fonte de verdade
- Documento-Mestre = governança, histórico, roadmap, frente ativa e ponto de retomada
- AGENTS.md = contrato operacional do agente
- RUN-SUMMARY.md = trilha mínima de auditoria operacional

## 3. Regra de precedência operacional
- a frente funcional crítica já aberta tem precedência histórica e lógica sobre frentes estruturais posteriores
- frentes estruturais posteriores não apagam nem anulam a frente crítica anterior
- o agente não pode reinterpretar sozinho a ordem do roadmap
- o agente deve operar com baseline funcional preservada + baseline estrutural complementar + foco no deploy / go-live do MVP

## 4. Frente funcional imediatamente anterior preservada
- R1.8.x — blindagem fiscal mínima orientada à entrega do MVP
- status:
  - validada materialmente
  - minimamente automatizada
  - estabilizada no corte aprovado do MVP

## 5. Frente estrutural ativa atual
- R1.11a — entrega segura mínima, qualidade pragmática e readiness de go-live controlado

Objetivo:
- validar estado real de testes, build, runtime, massa mínima e readiness
- preparar deploy / go-live controlado do MVP
- reduzir risco de piloto com governança mínima suficiente

## 6. Princípios obrigatórios
- foco em MVP funcional
- não expandir escopo
- não fazer refatoração ornamental
- não reordenar roadmap por conta própria
- alterações pequenas, testáveis e reversíveis
- sempre gerar evidência mínima útil
- sempre registrar o que foi feito
- priorizar execução sobre documentação
- mover para R1.1 / R2 tudo que não bloqueia o MVP real

## 7. Leitura multiagente obrigatória para mudanças relevantes
Sempre considerar:
- Produto / Negócio
- Operação / Jornada
- Arquitetura
- Qualidade / Auditoria
- Financeiro / Fiscal / Compliance
- Migração / Go-live / Entrega
- Segurança / Entrega segura
- Inovação / Crítica estratégica

Saída mínima esperada:
- o que ganhamos
- o que arriscamos
- o que adiamos
- o que pode ir para R1.1 / R2
- o que não pode passar despercebido
- recomendação de corte

## 8. Escopo de autonomia

### Pode fazer sem aprovação
- ler arquivos do repositório
- propor ajustes pequenos e localizados
- criar / ajustar testes
- rodar build, test e lint
- ajustar documentação operacional leve
- gerar resumo de execução
- atuar dentro da frente ativa atual sem mudar a ordem do roadmap

### Exige aprovação
- alterar schema (Prisma)
- criar migration
- alterar contratos amplos de API
- alterar autenticação / autorização
- alterar fluxos fiscais
- alterar CI / CD
- alterar múltiplos domínios ao mesmo tempo
- reabrir frente já encerrada

### Nunca fazer sozinho
- apagar dados
- alterar credenciais reais
- fazer mudança destrutiva
- redefinir roadmap
- tratar R1.11a como substituição da R1.8.x
- executar refatoração ampla sem necessidade comprovada

## 9. Áreas críticas
Tratar com máxima cautela:
- prisma/schema.prisma
- prisma/migrations/*
- seed principal
- auth/*
- fiscal-documents/*
- permissions/*
- availability/*
- appointments/*
- CI/CD configs
- env/config

## 10. Política de execução
- sempre trabalhar em pequenas entregas
- sempre validar antes de seguir
- não acumular mudanças grandes sem checkpoint
- preferir correção incremental
- não reabrir blocos já fechados sem evidência nova
- não expandir escopo por conveniência

## 11. Comandos oficiais mínimos consolidados

### 11.1 Raiz do workspace
Executar na raiz quando o objetivo for evidência repo-wide:
- instalar dependências: pnpm install
- build repo-wide: pnpm build
- testes repo-wide: pnpm test
- lint repo-wide: pnpm lint

### 11.2 services/api
Executar em services/api quando o objetivo for comportamento do serviço real:
- build da API: pnpm build
- testes da API: pnpm test
- lint da API: pnpm lint
- runtime da API: pnpm start:dev
- prisma generate: pnpm prisma:generate
- prisma migrate: pnpm prisma:migrate
- seed: pnpm prisma:seed

Regra:
- não presumir que comandos do services/api existem na raiz
- quando houver dúvida, inspecionar package.json da raiz e package.json de services/api antes de agir

## 12. Higiene de sessão do Codex
- Ctrl+L limpa só a tela e mantém a conversa
- /clear limpa a tela e inicia nova conversa na mesma sessão
- /new inicia nova conversa na mesma sessão sem limpar a tela
- /resume retoma conversa salva
- com 60% ou mais de contexto restante: seguir normalmente
- entre 60% e 40%: evitar logs longos e preferir resumos/checkpoints
- entre 40% e 25%: preparar handoff e fechar bloco atual
- abaixo de 25%: atualizar RUN-SUMMARY e preferir nova conversa em vez de empilhar mais contexto

## 13. Formato obrigatório da resposta final do agente
Sempre retornar:
- objetivo
- o que foi feito
- arquivos alterados
- comandos executados
- resultado
- riscos
- pendências
- próximo passo

## 14. Definition of Done da frente ativa (R1.11a)
- build OK
- testes executáveis
- massa mínima funcional definida
- runtime validado
- smoke / manual ready
- readiness mínimo explícito
- rollback mínimo claro
- pronto para piloto / go-live controlado no corte aprovado

## 15. Regra de ouro
Não complique o que precisa ir para produção.
Entrega > perfeição.
