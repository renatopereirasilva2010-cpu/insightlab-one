import { ShieldOff } from "lucide-react";

export function NoReportAccess() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-10 text-center">
      <ShieldOff className="text-muted-foreground h-6 w-6" />
      <p className="text-sm font-medium">Você não tem permissão para ver este relatório.</p>
      <p className="text-muted-foreground text-sm">
        Peça a um Gerente ou Administrador para liberar este relatório para o seu perfil.
      </p>
    </div>
  );
}
