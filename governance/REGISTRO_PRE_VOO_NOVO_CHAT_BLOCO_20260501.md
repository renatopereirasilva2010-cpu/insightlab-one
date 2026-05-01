# REGISTRO DE PRE-VOO PARA NOVO CHAT / NOVO BLOCO TECNICO

## 1. Identificacao do registro

- Data: 2026-05-01
- Projeto: InsightLab One
- Frente ativa: R1.11a
- Contexto: continuidade controlada pos-V51
- Arquivo relacionado: `docs/llm/InsightLab_One_Documento_Mestre_V51.txt`
- Registro criado para: padronizar o checklist obrigatorio antes de abrir novo chat ou novo bloco tecnico do projeto

## 2. Objetivo

Este registro formaliza o checklist minimo obrigatorio de pre-voo operacional que deve ser executado sempre antes de abrir um novo chat ou um novo bloco tecnico do projeto InsightLab One.

A finalidade e evitar retomada em ambiente inconsistente, banco errado, API fora do ar, token invalido, rota protegida nao testada ou continuidade baseada apenas em memoria/documentacao sem validacao real de runtime.

## 3. Decisao consolidada

A partir deste registro, toda nova versao do Documento-Mestre deve incluir obrigatoriamente este checklist de pre-voo como requisito de retomada operacional.

A regra vale especialmente quando o Documento-Mestre for usado como handoff para novo chat do projeto.

## 4. Checklist obrigatorio de pre-voo

Antes de abrir novo bloco tecnico, validar:

- [ ] Docker Desktop / Docker Engine respondendo
- [ ] Containers principais UP
- [ ] PostgreSQL operacional validado
- [ ] Banco correto acessivel
- [ ] Tabelas principais existentes
- [ ] API Nest subindo sem erro
- [ ] API respondendo na porta 4000
- [ ] Rota protegida sem token retornando 401
- [ ] Login real com usuario demo funcionando
- [ ] accessToken emitido
- [ ] Rota protegida com Bearer token retornando JSON valido
- [ ] Git status revisado antes de qualquer alteracao

## 5. Comandos de referencia do pre-voo

### 5.1 Validar Docker, containers e banco

Executar no WSL, a partir do workspace:

```bash
cd ~/projects/insightlab-one/workspace || exit 1

echo
echo "===== STATUS ATUAL DOS CONTAINERS ====="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo
echo "===== AGUARDAR pg_old_inspect ACEITAR CONEXOES ====="
for i in $(seq 1 30); do
  echo "Tentativa $i/30..."
  if docker exec -e PGPASSWORD=insightlab123 -i pg_old_inspect \
    pg_isready -U insightlab -d insightlab_one >/dev/null 2>&1; then
    echo "[OK] pg_old_inspect aceitando conexoes"
    break
  fi

  docker logs --tail 10 pg_old_inspect
  sleep 2
done

echo
echo "===== VALIDAR DATABASES ====="
docker exec -e PGPASSWORD=insightlab123 -i pg_old_inspect \
  psql -U insightlab -lqt

echo
echo "===== VALIDAR TABELAS PRINCIPAIS ====="
docker exec -e PGPASSWORD=insightlab123 -i pg_old_inspect \
  psql -U insightlab -d insightlab_one -c '\dt'

echo
echo "===== VALIDAR CONTAGEM BASICA DE TABELAS ====="
docker exec -e PGPASSWORD=insightlab123 -i pg_old_inspect \
  psql -U insightlab -d insightlab_one -c "select count(*) as total_tables from information_schema.tables where table_schema = 'public';"

```

### 5.2 Subir API

Executar em terminal separado, dentro da API, somente se a API ainda nao estiver rodando:

```bash
cd ~/projects/insightlab-one/workspace/services/api || exit 1

DATABASE_URL="postgresql://insightlab:insightlab123@localhost:5433/insightlab_one?schema=public" pnpm start:dev
```

Criterio esperado:

```text
Nest application successfully started
```

Observacao: se a API ja estiver UP na porta 4000, nao subir outra instancia. Apenas seguir para o smoke HTTP.

### 5.3 Smoke HTTP, login e rota protegida

Executar em outro terminal, mantendo a API rodando:

```bash
cd ~/projects/insightlab-one/workspace/services/api || exit 1

API_URL="http://localhost:4000"

curl -i "$API_URL/v1/clients"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mix-demo.local","password":"Admin@12345"}')

printf '%s\n' "$LOGIN_RESPONSE" | python3 -m json.tool

ACCESS_TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$API_URL/v1/clients" | python3 -m json.tool
```

## 6. Evidencia real da rodada de 2026-05-01

Nesta rodada, o pre-voo foi executado e validado com sucesso.

Foram validados:

- Docker Desktop / Docker Engine respondendo
- containers principais ativos
- `pg_old_inspect` operacional na porta 5433
- banco `insightlab_one` acessivel
- 37 tabelas no schema public
- API Nest iniciada com sucesso na porta 4000
- rota protegida `/v1/clients` sem token retornando `401 Unauthorized`
- login com `admin@mix-demo.local` funcionando
- emissao de `accessToken` e `refreshToken`
- rota protegida `/v1/clients` com Bearer token retornando JSON valido

## 7. Decisao operacional

Status do pre-voo de 2026-05-01:

- [x] APROVADO
- [ ] APROVADO COM RESSALVAS
- [ ] REPROVADO

Conclusao:

O ambiente local esta apto para abertura do proximo bloco tecnico, desde que o escopo permaneca dentro da continuidade controlada da R1.11a e sem reabertura indevida da R1.10.

## 8. Regra para proximas versoes do Documento-Mestre

Toda nova versao do Documento-Mestre deve conter uma secao explicita chamada:

```text
CHECKLIST OBRIGATORIO DE PRE-VOO PARA NOVO CHAT / NOVO BLOCO
```

Essa secao deve incluir, no minimo:

- validacao do Docker
- validacao dos containers
- validacao do banco operacional
- validacao da API Nest na porta 4000
- validacao de rota protegida sem token
- login real
- extracao de Bearer token
- validacao de rota protegida autenticada
- revisao do Git status

## 9. Observacao de governanca

Este registro nao altera escopo funcional, nao reabre R1.10 e nao substitui os registros anteriores de piloto/go-live.

Ele adiciona uma camada obrigatoria de seguranca operacional para retomadas futuras, reduzindo risco de continuidade em ambiente inconsistente.

## 10. Encerramento

- Responsavel pelo registro: Renato Pereira da Silva
- Data do registro: 2026-05-01
- Status: valido como requisito de retomada para novos chats e novos blocos tecnicos