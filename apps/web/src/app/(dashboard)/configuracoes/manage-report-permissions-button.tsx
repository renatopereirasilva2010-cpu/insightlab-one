"use client";

import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/entity-dialog";
import type { Role } from "@/lib/api-types";
import { ReportPermissionsForm } from "./report-permissions-form";

export function ManageReportPermissionsButton({ role }: { role: Role }) {
  return (
    <EntityDialog
      title={`Relatórios do papel: ${role.name}`}
      description="Liberação restrita ao módulo de relatórios — outras permissões seguem só com um Administrador."
      trigger={
        <Button variant="ghost" size="sm" title="Relatórios visíveis">
          <BarChart3 />
        </Button>
      }
    >
      {() => <ReportPermissionsForm role={role} />}
    </EntityDialog>
  );
}
