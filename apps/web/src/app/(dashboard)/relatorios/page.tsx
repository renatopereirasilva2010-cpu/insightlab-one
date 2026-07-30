import Link from "next/link";
import { BarChart3, TrendingUp, Wallet, CalendarClock, PackageX, UserX } from "lucide-react";
import { verifySession, hasPermission } from "@/lib/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const REPORTS = [
  {
    permission: "reports.revenue.read",
    href: "/relatorios/faturamento",
    title: "Faturamento",
    description: "Tendência de receita e breakdown por profissional/serviço num período livre.",
    icon: TrendingUp,
  },
  {
    permission: "reports.commissions.read",
    href: "/relatorios/comissoes",
    title: "Comissões",
    description: "Comissão gerada por profissional no período selecionado.",
    icon: Wallet,
  },
  {
    permission: "reports.appointments.read",
    href: "/relatorios/ocupacao",
    title: "Ocupação de agenda",
    description: "Agendamentos por status e por profissional no período.",
    icon: CalendarClock,
  },
  {
    permission: "reports.inventory.read",
    href: "/relatorios/estoque",
    title: "Estoque baixo",
    description: "Produtos no ou abaixo do estoque mínimo, agora.",
    icon: PackageX,
  },
  {
    permission: "reports.clients-churn.read",
    href: "/relatorios/clientes-inativos",
    title: "Clientes inativos",
    description: "Clientes ativos sem visita recente — risco de receita.",
    icon: UserX,
  },
] as const;

export default async function RelatoriosPage() {
  const user = await verifySession();
  const visibleReports = REPORTS.filter((r) => hasPermission(user, r.permission));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-primary h-6 w-6 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-muted-foreground text-sm">
            Cada relatório é liberado por permissão — peça a um Gerente ou Administrador se algum
            estiver faltando.
          </p>
        </div>
      </div>

      {visibleReports.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum relatório liberado para o seu perfil ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleReports.map((report) => (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <report.icon className="text-primary mb-2 h-5 w-5" />
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
