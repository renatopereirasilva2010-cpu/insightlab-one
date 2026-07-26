import { verifySession, hasPermission } from "@/lib/auth";
import { safeList } from "@/lib/safe-fetch";
import { DataTable } from "@/components/data-table";
import { StatusBadge, genericStatusLabels, genericStatusVariants } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { Professional } from "@/lib/api-types";
import { NewProfessionalButton } from "./new-professional-button";

export default async function ProfissionaisPage() {
  const user = await verifySession();
  const { items: professionals, error } = await safeList<Professional>("/v1/professionals");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profissionais</h1>
          <p className="text-muted-foreground">
            Equipe disponível para atendimentos e agendamentos.
          </p>
        </div>
        {hasPermission(user, "professionals.create") && <NewProfessionalButton />}
      </div>

      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <DataTable<Professional>
        rows={professionals}
        rowKey={(p) => p.id}
        emptyMessage="Nenhum profissional cadastrado ainda."
        columns={[
          { header: "Nome", cell: (p) => p.name },
          { header: "Função", cell: (p) => p.roleTitle ?? "—" },
          { header: "Telefone", cell: (p) => p.phone ?? "—" },
          { header: "E-mail", cell: (p) => p.email ?? "—" },
          {
            header: "Status",
            cell: (p) => (
              <StatusBadge
                status={p.status}
                labels={genericStatusLabels}
                variants={genericStatusVariants}
              />
            ),
          },
          { header: "Cadastrado em", cell: (p) => formatDate(p.createdAt) },
        ]}
      />
    </div>
  );
}
