import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function StatusBadge({
  status,
  labels,
  variants,
}: {
  status: string;
  labels: Record<string, string>;
  variants: Record<string, BadgeVariant>;
}) {
  return <Badge variant={variants[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

export const appointmentStatusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  CHECKED_IN: "Check-in feito",
  IN_SERVICE: "Em atendimento",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

export const appointmentStatusVariants: Record<string, BadgeVariant> = {
  SCHEDULED: "outline",
  CONFIRMED: "secondary",
  CHECKED_IN: "secondary",
  IN_SERVICE: "default",
  COMPLETED: "default",
  CANCELED: "destructive",
  NO_SHOW: "destructive",
};

export const attendanceStatusLabels: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Finalizado",
  CANCELED: "Cancelado",
};

export const attendanceStatusVariants: Record<string, BadgeVariant> = {
  OPEN: "outline",
  IN_PROGRESS: "default",
  FINISHED: "secondary",
  CANCELED: "destructive",
};

export const saleStatusLabels: Record<string, string> = {
  OPEN: "Aberta",
  READY_FOR_CHECKOUT: "Pronta p/ checkout",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
};

export const saleStatusVariants: Record<string, BadgeVariant> = {
  OPEN: "outline",
  READY_FOR_CHECKOUT: "default",
  COMPLETED: "secondary",
  CANCELED: "destructive",
};

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  CANCELED: "Cancelado",
};

export const paymentStatusVariants: Record<string, BadgeVariant> = {
  PENDING: "outline",
  PAID: "secondary",
  FAILED: "destructive",
  CANCELED: "destructive",
};

export const cashRegisterStatusLabels: Record<string, string> = {
  OPEN: "Aberto",
  CLOSED: "Fechado",
};

export const cashRegisterStatusVariants: Record<string, BadgeVariant> = {
  OPEN: "default",
  CLOSED: "outline",
};

export const commissionStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  RELEASED: "Liberada",
  BLOCKED: "Bloqueada",
  CANCELED: "Cancelada",
};

export const commissionStatusVariants: Record<string, BadgeVariant> = {
  PENDING: "outline",
  RELEASED: "secondary",
  BLOCKED: "destructive",
  CANCELED: "destructive",
};

export const fiscalDocumentStatusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  REQUESTED: "Solicitado",
  AUTHORIZED: "Autorizado",
  CANCELED: "Cancelado",
  FAILED: "Falhou",
};

export const fiscalDocumentStatusVariants: Record<string, BadgeVariant> = {
  DRAFT: "outline",
  REQUESTED: "default",
  AUTHORIZED: "secondary",
  CANCELED: "destructive",
  FAILED: "destructive",
};

export const genericStatusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  BLOCKED: "Bloqueado",
};

export const genericStatusVariants: Record<string, BadgeVariant> = {
  ACTIVE: "secondary",
  INACTIVE: "outline",
  BLOCKED: "destructive",
};

export const paymentMethodLabels: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BANK_TRANSFER: "Transferência",
  DEFERRED: "A prazo",
};
