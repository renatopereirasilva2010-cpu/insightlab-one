-- RLS proof-of-concept (ONDA 0 / seguranca): isolamento real de tenant no nivel do banco.
-- Pre-requisito ja aplicado fora desta migration: papel nao-superuser `insightlab_app`
-- (superuser sempre ignora RLS, mesmo com FORCE - por isso o app runtime nao pode
-- mais conectar como `insightlab`, o owner/superuser usado soh para rodar migrations).

ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Payment"
  USING ("tenantId" = current_setting('app.tenant_id', true));
