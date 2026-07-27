import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import {
  StatusBadge,
  saleStatusLabels,
  saleStatusVariants,
  paymentStatusLabels,
  paymentStatusVariants,
  paymentMethodLabels,
} from "@/components/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Sale,
  SaleItem,
  ServiceCatalogItem,
  Product,
  Payment,
  CashRegister,
  Client,
  Professional,
} from "@/lib/api-types";
import { AddItemButton } from "./add-item-button";
import { SaleStatusActions } from "./sale-status-actions";
import { NewPaymentButton } from "./new-payment-button";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await verifySession();

  const [
    { items: sales },
    { items: services },
    { items: products },
    { items: payments },
    { items: cashRegisters },
    { items: clients },
    { items: professionals },
  ] = await Promise.all([
    safeList<Sale>("/v1/sales"),
    safeList<ServiceCatalogItem>("/v1/services-catalog"),
    safeList<Product>("/v1/products"),
    safeList<Payment>("/v1/payments"),
    safeList<CashRegister>("/v1/cash-register"),
    safeList<Client>("/v1/clients"),
    safeList<Professional>("/v1/professionals"),
  ]);

  const sale = sales.find((s) => s.id === id);
  if (!sale) notFound();

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const professionalById = new Map(professionals.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const productById = new Map(products.map((p) => [p.id, p]));

  const salePayments = payments.filter((p) => p.saleId === sale.id);
  const paidTotal = salePayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(sale.totalAmount) - paidTotal);
  const openRegisters = cashRegisters.filter((r) => r.status === "OPEN");

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/vendas">
          <ArrowLeft />
          Voltar para Vendas
        </Link>
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Venda</h1>
          <p className="text-muted-foreground">
            {sale.clientId ? clientById.get(sale.clientId)?.name : "Sem cliente definido"}
            {sale.professionalId ? ` · ${professionalById.get(sale.professionalId)?.name}` : ""}
          </p>
        </div>
        <StatusBadge status={sale.status} labels={saleStatusLabels} variants={saleStatusVariants} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Subtotal</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(sale.subtotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Desconto</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(sale.discountAmount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(sale.totalAmount)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <SaleStatusActions
        sale={sale}
        canUpdate={hasPermission(user, "sales.update")}
        canCheckout={hasPermission(user, "sales.checkout")}
        canCancel={hasPermission(user, "sales.cancel")}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Itens</h2>
          {hasPermission(user, "sales.update") && sale.status === "OPEN" && (
            <AddItemButton
              saleId={sale.id}
              services={services}
              products={products}
              professionals={professionals}
            />
          )}
        </div>

        <DataTable<SaleItem>
          rows={sale.items}
          rowKey={(i) => i.id}
          emptyMessage="Nenhum item adicionado ainda."
          columns={[
            {
              header: "Item",
              cell: (i) =>
                i.description ??
                (i.itemType === "SERVICE"
                  ? serviceById.get(i.serviceId ?? "")?.name
                  : productById.get(i.productId ?? "")?.name) ??
                "—",
            },
            { header: "Tipo", cell: (i) => (i.itemType === "SERVICE" ? "Serviço" : "Produto") },
            {
              header: "Profissional",
              cell: (i) =>
                i.professionalId ? professionalById.get(i.professionalId)?.name ?? "—" : "—",
            },
            { header: "Qtd.", cell: (i) => i.quantity },
            { header: "Preço unit.", cell: (i) => formatCurrency(i.unitPrice) },
            { header: "Total", cell: (i) => formatCurrency(i.totalPrice) },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Pagamentos</h2>
            <p className="text-muted-foreground text-sm">
              Restante a pagar: {formatCurrency(remaining)}
            </p>
          </div>
          {hasPermission(user, "payments.create") &&
            (sale.status === "OPEN" || sale.status === "READY_FOR_CHECKOUT") && (
              <NewPaymentButton
                saleId={sale.id}
                defaultAmount={remaining || Number(sale.totalAmount)}
                openRegisters={openRegisters}
              />
            )}
        </div>

        <DataTable<Payment>
          rows={salePayments}
          rowKey={(p) => p.id}
          emptyMessage="Nenhum pagamento registrado ainda."
          columns={[
            { header: "Método", cell: (p) => paymentMethodLabels[p.method] ?? p.method },
            { header: "Valor", cell: (p) => formatCurrency(p.amount) },
            {
              header: "Status",
              cell: (p) => (
                <StatusBadge status={p.status} labels={paymentStatusLabels} variants={paymentStatusVariants} />
              ),
            },
            { header: "Criado em", cell: (p) => formatDateTime(p.createdAt) },
          ]}
        />
      </section>
    </div>
  );
}
