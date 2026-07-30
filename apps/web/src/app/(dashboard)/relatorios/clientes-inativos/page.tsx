import { UserX } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import type { Client, Appointment, Attendance } from "@/lib/api-types";
import { DormantClientsPanel } from "../../painel/dormant-clients-panel";
import { NoReportAccess } from "../no-report-access";

export default async function ClientesInativosReportPage() {
  const user = await verifySession();
  if (!hasPermission(user, "reports.clients-churn.read")) return <NoReportAccess />;

  const [{ items: clients }, { items: appointments }, { items: attendances }] = await Promise.all([
    safeList<Client>("/v1/clients"),
    safeList<Appointment>("/v1/appointments"),
    safeList<Attendance>("/v1/attendances"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserX className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Clientes inativos</h1>
          <p className="text-muted-foreground text-sm">
            Clientes ativos sem visita recente — sinal direto de receita em risco.
          </p>
        </div>
      </div>

      <DormantClientsPanel clients={clients} appointments={appointments} attendances={attendances} />
    </div>
  );
}
