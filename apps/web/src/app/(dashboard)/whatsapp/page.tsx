import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  whatsAppMessageStatusLabels,
  whatsAppMessageStatusVariants,
} from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { WhatsAppMessage, Client } from "@/lib/api-types";
import { MessageRowActions } from "./message-row-actions";

const TEMPLATE_LABELS: Record<string, string> = {
  agendamento_confirmado: "Confirmação de agendamento",
};

export default async function WhatsAppPage() {
  const user = await verifySession();

  const [{ items: messages, error }, { items: clients }] = await Promise.all([
    safeList<WhatsAppMessage>("/v1/whatsapp/messages"),
    safeList<Client>("/v1/clients"),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const hasCredentials = messages.some((m) => m.status !== "SKIPPED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Confirmações de agendamento enviadas via WhatsApp (Meta Cloud API, modo de teste).
        </p>
      </div>

      {!hasCredentials && messages.length > 0 && (
        <div className="rounded-md border p-3">
          <p className="text-sm font-medium">Nenhuma credencial do WhatsApp configurada ainda</p>
          <p className="text-muted-foreground text-sm">
            As mensagens abaixo foram puladas (não enviadas de verdade). Configure
            WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID (credenciais de sandbox do Meta for
            Developers) para ativar o envio.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<WhatsAppMessage>
        rows={sorted}
        rowKey={(m) => m.id}
        emptyMessage="Nenhuma mensagem de WhatsApp registrada ainda."
        columns={[
          {
            header: "Cliente",
            cell: (m) => (m.clientId && clientById.get(m.clientId)?.name) || "—",
          },
          { header: "Telefone", cell: (m) => m.toPhone },
          { header: "Modelo", cell: (m) => TEMPLATE_LABELS[m.templateName] ?? m.templateName },
          {
            header: "Status",
            cell: (m) => (
              <StatusBadge
                status={m.status}
                labels={whatsAppMessageStatusLabels}
                variants={whatsAppMessageStatusVariants}
              />
            ),
          },
          {
            header: "Erro",
            cell: (m) => m.errorMessage ?? "—",
          },
          { header: "Criada em", cell: (m) => formatDateTime(m.createdAt) },
          {
            header: "",
            className: "text-right",
            cell: (m) =>
              hasPermission(user, "whatsapp.resend") ? <MessageRowActions message={m} /> : null,
          },
        ]}
      />
    </div>
  );
}
