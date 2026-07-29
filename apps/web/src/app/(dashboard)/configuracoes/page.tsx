import { verifySession, hasPermission } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatusBadge, genericStatusLabels, genericStatusVariants } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BusinessSettings, UserListItem, Role } from "@/lib/api-types";

const RELEASE_MODE_LABELS: Record<string, string> = {
  ON_PAYMENT: "Ao pagamento",
  MANUAL: "Manual",
  IMMEDIATE: "Imediato",
};

async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  try {
    return await apiFetch<BusinessSettings>("/v1/business-settings");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return null;
    throw err;
  }
}

export default async function ConfiguracoesPage() {
  const user = await verifySession();

  const [settings, { items: users }, { items: roles }] = await Promise.all([
    hasPermission(user, "settings.read") ? fetchBusinessSettings() : Promise.resolve(null),
    safeList<UserListItem>("/v1/users"),
    safeList<Role>("/v1/roles"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">
          Parâmetros do negócio, usuários e papéis. Somente leitura nesta versão.
        </p>
      </div>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Negócio</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="roles">Papéis</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          {!settings ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma configuração encontrada para este negócio.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>Fuso horário</CardDescription>
                  <CardTitle className="text-lg">{settings.timezone}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Moeda</CardDescription>
                  <CardTitle className="text-lg">{settings.currency}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Prazo de cancelamento</CardDescription>
                  <CardTitle className="text-lg">{settings.cancelPolicyHours}h</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Tolerância de atraso</CardDescription>
                  <CardTitle className="text-lg">{settings.lateToleranceMinutes} min</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Liberação de comissão</CardDescription>
                  <CardTitle className="text-lg">
                    {RELEASE_MODE_LABELS[settings.commissionReleaseMode] ?? settings.commissionReleaseMode}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Pagamento diferido</CardDescription>
                  <CardTitle className="text-lg">
                    {settings.allowDeferredPayment ? "Permitido" : "Não permitido"}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Liberar comissão com pagamento a prazo</CardDescription>
                  <CardTitle className="text-lg">
                    {settings.commissionReleaseAllowDeferred ? "Permitido" : "Não permitido"}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <DataTable<UserListItem>
            rows={users}
            rowKey={(u) => u.id}
            emptyMessage="Nenhum usuário encontrado."
            columns={[
              { header: "Nome", cell: (u) => u.name },
              { header: "E-mail", cell: (u) => u.email },
              {
                header: "Status",
                cell: (u) => (
                  <StatusBadge
                    status={u.status}
                    labels={genericStatusLabels}
                    variants={genericStatusVariants}
                  />
                ),
              },
              { header: "Criado em", cell: (u) => formatDate(u.createdAt) },
            ]}
          />
        </TabsContent>

        <TabsContent value="roles">
          <DataTable<Role>
            rows={roles}
            rowKey={(r) => r.id}
            emptyMessage="Nenhum papel encontrado."
            columns={[
              { header: "Código", cell: (r) => r.code },
              { header: "Nome", cell: (r) => r.name },
              { header: "Descrição", cell: (r) => r.description ?? "—" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
