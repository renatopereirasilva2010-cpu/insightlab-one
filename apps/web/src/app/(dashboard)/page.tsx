import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

interface Client {
  id: string;
}

interface Appointment {
  id: string;
  status: string;
}

async function safeCount<T>(path: string): Promise<number | null> {
  try {
    const data = await apiFetch<T[]>(path);
    return data.length;
  } catch {
    return null;
  }
}

export default async function DashboardHomePage() {
  const user = await verifySession();

  const [clientsCount, appointmentsCount] = await Promise.all([
    safeCount<Client>("/v1/clients"),
    safeCount<Appointment>("/v1/appointments"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {user.email}</h1>
        <p className="text-muted-foreground">
          Visão geral da sua operação.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Clientes cadastrados</CardDescription>
            <CardTitle className="text-3xl">
              {clientsCount ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Agendamentos</CardDescription>
            <CardTitle className="text-3xl">
              {appointmentsCount ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Permissões ativas</CardDescription>
            <CardTitle className="text-3xl">{user.permissions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Papel administrativo completo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
