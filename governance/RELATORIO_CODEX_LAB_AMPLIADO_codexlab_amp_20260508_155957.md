# RELATÓRIO CODEX LAB AMPLIADO

## 1. Marcador da rodada

- `codexlab_amp_20260508_155957`

## 2. Data/hora

- Início observado: `2026-05-08T16:00:17-03:00`
- Janela principal de execução: `2026-05-08 16:00` a `2026-05-08 16:04`
- Timezone: `America/Sao_Paulo`

## 3. Ambiente usado

- API Lab: `http://localhost:4001`
- Banco Lab: `postgresql://insightlab:insightlab123@localhost:5434/insightlab_one_codex_lab?schema=public`
- Redis: `redis://localhost:6379`
- Confirmação SQL: `current_database() = insightlab_one_codex_lab`, `current_schema() = public`

## 4. Confirmações negativas obrigatórias

- Não foi usado `http://localhost:4000`
- Não foi usado `localhost:5433`
- Não foi usado o banco canônico `insightlab_one`
- Não houve alteração de código da aplicação
- Não houve alteração de `schema.prisma`
- Não houve alteração de migrations
- Não houve alteração de seed
- Não houve alteração de `auth`, `permissions`, `guards` ou `decorators`
- Não houve commit
- Não houve push
- Não houve saída da sandbox autorizada

## 5. Resultado executivo

A rodada Codex Lab ampliada foi concluída no ambiente Lab com evidências suficientes para classificar o fluxo como:

**APROVADO COM OBSERVAÇÕES**

O fluxo principal validado foi:

`appointment -> attendance -> sale -> payment -> cash-register -> commission -> fiscal-document`

Também foram validados cenários de agenda, conflito, overbook, cancelamento, no-show, transições inválidas, fiscal documents e migração assistida mínima.

## 6. Resumo por módulo

### 6.1 Autenticação e contexto

- `GET /v1/clients` sem token retornou `401`
- `POST /v1/auth/login` funcionou com `admin@mix-demo.local`
- `GET /v1/clients` com Bearer retornou `200`
- Usuário admin teve permissões suficientes para os módulos exercitados

### 6.2 Catálogos operacionais

Leituras autenticadas retornaram `200` para:

- `clients`
- `professionals`
- `services-catalog`
- `products`
- `supplies`
- `resources`
- `unit-conversions`
- `appointments`
- `attendances`
- `sales`
- `payments`
- `cash-register`
- `commissions`
- `fiscal-documents`
- `admin-master/migration-jobs`

### 6.3 Agenda e disponibilidade

- `GET /v1/availability` sem parâmetros retornou `400`
- `GET /v1/availability?professionalId=...&date=2026-06-29T00:00:00.000Z` retornou `200`
- Tentativa de criar disponibilidade `09:00-10:00` retornou `400 AVAILABILITY_CONFLICT`
- Não houve nova disponibilidade criada; portanto, nada precisou ser inativado

### 6.4 Appointments

- Appointment base criado com `201`
- Conflito no mesmo slot/profissional sem overbook retornou `400 APPOINTMENT_CONFLICT`
- Appointment com `isOverbook=true` criado com `201`
- Cancelamento retornou `201`
- Tentativa `CANCELED -> NO_SHOW` retornou `400 APPOINTMENT_INVALID_STATUS_TRANSITION`
- No-show retornou `201`
- Tentativa `NO_SHOW -> CANCELED` retornou `400 APPOINTMENT_INVALID_STATUS_TRANSITION`

### 6.5 Fluxo operacional-financeiro

Fluxo validado ponta a ponta no Lab:

- Appointment criado com `201`
- Attendance criado com `201`
- Attendance start retornou `201`
- Attendance finish retornou `201`
- Sale criada com `201`
- Sale item criado com `201`
- Sale recalculate retornou `201`
- Sale ready-for-checkout retornou `201`
- Cash register aberto com `201`
- Payment criado com `201`
- Payment mark-paid retornou `201`
- Commission generate retornou `201`
- Fiscal document criado com `201`
- Fiscal document `REQUESTED` retornou `201`
- Fiscal document `AUTHORIZED` retornou `201`

### 6.6 Migração assistida

- `GET /v1/admin-master/migration-jobs` retornou `200`
- Criação de migration job `MANUAL` retornou `201`
- Import batch mínimo retornou `201`
- Reconcile retornou `201`
- Status final observado: `RECONCILED`

### 6.7 Fiscal documents

- `GET /v1/fiscal-documents` retornou `200`
- `GET /v1/fiscal-documents/not-found-...` retornou `404 FISCAL_DOCUMENT_NOT_FOUND`
- Não houve chamada a provedor externo

### 6.8 Permissões

- `401` validado para token ausente
- `400` validado para contrato/regra de negócio
- `404` validado para recurso inexistente
- `403` não foi observado, pois a rodada usou usuário admin com cobertura ampla de permissões

## 7. IDs criados no Lab

- `appointmentBaseId`: `cmoxa8voa0001bpcb7dmwud8i`
- `appointmentOverbookId`: `cmoxa8wox0003bpcbb8c5ymxw`
- `appointmentCancelId`: `cmoxa8wwq0005bpcbydh0w15a`
- `appointmentNoShowId`: `cmoxa8xfq0007bpcbnk0wnud6`
- `appointmentFlowId`: `cmoxaaji50009bpcbx2cbsxit`
- `attendanceId`: `cmoxaajnj000bbpcbyc2xn0vh`
- `saleId`: `cmoxaakay000dbpcboix4cysd`
- `cashRegisterId`: `cmoxaal92000hbpcbznqttvwq`
- `paymentId`: `cmoxaalhu000jbpcb6p0lpo7s`
- `commissionId`: `cmoxaam4l000lbpcbqsig1hoy`
- `fiscalDocumentId`: `cmoxaamg8000nbpcb7kzhrn4n`
- `migrationJobId`: `cmoxaan6t000sbpcbhkt2ctfk`

## 8. Registros limpos / inativados

- Caixa criado na rodada foi fechado ao final: `cashRegisterId cmoxaal92000hbpcbznqttvwq`
- Nenhuma nova disponibilidade foi criada
- Demais registros foram mantidos no Lab como evidência rastreável pelo marcador da rodada

## 9. Gaps encontrados

- Não houve cenário de `403` com usuário restrito
- A criação de disponibilidade colidiu com regra ativa já existente
- O appointment principal permaneceu `SCHEDULED` mesmo com attendance `FINISHED`, comportamento considerado alinhado com a decisão de domínio vigente do MVP/R1

## 10. Riscos

- Cobertura de permissões ainda parcial no eixo `403`
- Massa Lab já contém disponibilidade ativa para o profissional usado
- Fluxo depende de massa operacional válida de cliente, profissional, serviço e catálogo

## 11. Recomendação de próximo passo

Executar uma rodada complementar curta no Lab apenas para:

1. validar `403` com credencial restrita real, se existir usuário adequado;
2. testar criação de disponibilidade em horário/weekday livre, seguida de inativação.

Fora isso, o trilho principal possui evidência suficiente para readiness controlado do MVP.

## 12. Classificação final

**APROVADO COM OBSERVAÇÕES**

## 13. Evidências esperadas

- `.codex-runs/checkpoint_lab_codexlab_amp_20260508_155957.log`
- `.codex-runs/flow_lab_codexlab_amp_20260508_155957.log`
- `.codex-runs/login_codexlab_amp_20260508_155957.json`
- `.codex-runs/db_info_codexlab_amp_20260508_155957.json`