"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/api-types";
import { grantReportPermission, revokeReportPermission } from "./report-permission-actions";

const REPORT_OPTIONS = [
  { code: "reports.revenue.read", label: "Faturamento" },
  { code: "reports.commissions.read", label: "Comissões" },
  { code: "reports.appointments.read", label: "Ocupação de agenda" },
  { code: "reports.inventory.read", label: "Estoque baixo" },
  { code: "reports.clients-churn.read", label: "Clientes inativos" },
] as const;

export function ReportPermissionsForm({ role }: { role: Role }) {
  const router = useRouter();
  const granted = new Set(role.permissionCodes ?? []);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(code: string, currentlyGranted: boolean) {
    setPending(code);
    const result = currentlyGranted
      ? await revokeReportPermission(role.id, code)
      : await grantReportPermission(role.id, code);
    setPending(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(currentlyGranted ? "Relatório removido do papel." : "Relatório liberado para o papel.");
    router.refresh();
  }

  // reports.read (acesso ao modulo em si) precisa estar ligado pra qualquer
  // relatorio individual aparecer no /relatorios do usuario - concede/revoga
  // junto com o primeiro/ultimo relatorio pra nao exigir um passo extra.
  const hasModuleAccess = granted.has("reports.read");

  async function ensureModuleAccess(willHaveAnyReport: boolean) {
    if (willHaveAnyReport && !hasModuleAccess) {
      await grantReportPermission(role.id, "reports.read");
    }
    if (!willHaveAnyReport && hasModuleAccess) {
      await revokeReportPermission(role.id, "reports.read");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Escolha quais relatórios este papel enxerga em <span className="font-mono">/relatorios</span>.
      </p>
      <div className="space-y-2">
        {REPORT_OPTIONS.map((option) => {
          const isGranted = granted.has(option.code);
          return (
            <div key={option.code} className="flex items-center gap-2">
              <Checkbox
                id={option.code}
                checked={isGranted}
                disabled={pending !== null}
                onCheckedChange={async () => {
                  await toggle(option.code, isGranted);
                  const otherReportsGranted = REPORT_OPTIONS.some(
                    (o) => o.code !== option.code && granted.has(o.code),
                  );
                  await ensureModuleAccess(!isGranted || otherReportsGranted);
                  router.refresh();
                }}
              />
              <Label htmlFor={option.code} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
