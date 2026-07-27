import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  cashRegisterStatusLabels,
  cashRegisterStatusVariants,
} from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CashRegister } from "@/lib/api-types";
import { OpenRegisterButton } from "./open-register-button";
import { CloseRegisterButton } from "./close-register-button";

export default async function CaixaPage() {
  const user = await verifySession();
  const { items: registers, error } = await safeList<CashRegister>("/v1/cash-register");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Caixa</h1>
          <p className="text-muted-foreground">Abertura e fechamento de caixa.</p>
        </div>
        {hasPermission(user, "cash-register.open") && <OpenRegisterButton />}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<CashRegister>
        rows={registers}
        rowKey={(r) => r.id}
        emptyMessage="Nenhum caixa aberto ainda."
        emptyAction={hasPermission(user, "cash-register.open") ? <OpenRegisterButton /> : undefined}
        columns={[
          { header: "Nome", cell: (r) => r.name },
          {
            header: "Status",
            cell: (r) => (
              <StatusBadge
                status={r.status}
                labels={cashRegisterStatusLabels}
                variants={cashRegisterStatusVariants}
              />
            ),
          },
          { header: "Saldo abertura", cell: (r) => formatCurrency(r.openingBalance) },
          {
            header: "Saldo fechamento",
            cell: (r) => (r.closingBalance != null ? formatCurrency(r.closingBalance) : "—"),
          },
          { header: "Aberto em", cell: (r) => formatDateTime(r.openedAt) },
          { header: "Fechado em", cell: (r) => formatDateTime(r.closedAt) },
          {
            header: "",
            className: "text-right",
            cell: (r) =>
              r.status === "OPEN" && hasPermission(user, "cash-register.close") ? (
                <CloseRegisterButton registerId={r.id} />
              ) : null,
          },
        ]}
      />
    </div>
  );
}
