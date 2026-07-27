import Link from "next/link";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  paymentStatusLabels,
  paymentStatusVariants,
  paymentMethodLabels,
} from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Payment, Sale, Client, CashRegister } from "@/lib/api-types";
import { NewPaymentButton } from "./new-payment-button";
import { PaymentRowActions } from "./payment-row-actions";

export default async function PagamentosPage() {
  const user = await verifySession();

  const [
    { items: payments, error },
    { items: sales },
    { items: clients },
    { items: cashRegisters },
  ] = await Promise.all([
    safeList<Payment>("/v1/payments"),
    safeList<Sale>("/v1/sales"),
    safeList<Client>("/v1/clients"),
    safeList<CashRegister>("/v1/cash-register"),
  ]);

  const saleById = new Map(sales.map((s) => [s.id, s]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const eligibleSales = sales.filter((s) => s.status === "OPEN" || s.status === "READY_FOR_CHECKOUT");
  const openRegisters = cashRegisters.filter((r) => r.status === "OPEN");

  const sorted = [...payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pagamentos</h1>
          <p className="text-muted-foreground">Pagamentos recebidos, pendentes e com falha.</p>
        </div>
        {hasPermission(user, "payments.create") && (
          <NewPaymentButton
            eligibleSales={eligibleSales}
            clients={clients}
            openRegisters={openRegisters}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<Payment>
        rows={sorted}
        rowKey={(p) => p.id}
        emptyMessage="Nenhum pagamento ainda."
        columns={[
          {
            header: "Venda",
            cell: (p) => {
              const sale = saleById.get(p.saleId);
              const clientName = sale?.clientId ? clientById.get(sale.clientId)?.name : null;
              return (
                <Link href={`/vendas/${p.saleId}`} className="underline underline-offset-2">
                  {clientName ?? p.saleId.slice(0, 8)}
                </Link>
              );
            },
          },
          { header: "Método", cell: (p) => paymentMethodLabels[p.method] ?? p.method },
          { header: "Valor", cell: (p) => formatCurrency(p.amount) },
          {
            header: "Status",
            cell: (p) => (
              <StatusBadge status={p.status} labels={paymentStatusLabels} variants={paymentStatusVariants} />
            ),
          },
          { header: "Criado em", cell: (p) => formatDateTime(p.createdAt) },
          {
            header: "",
            className: "text-right",
            cell: (p) =>
              hasPermission(user, "payments.receive") || hasPermission(user, "payments.update-status") ? (
                <PaymentRowActions payment={p} />
              ) : null,
          },
        ]}
      />
    </div>
  );
}
