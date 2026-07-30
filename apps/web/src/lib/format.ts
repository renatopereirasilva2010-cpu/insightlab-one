const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export function formatCurrency(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return currencyFormatter.format(Number.isFinite(n) ? n : 0);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

/**
 * Nome social tem prioridade sobre o nome de registro sempre que
 * preenchido - o campo em si já é a escolha da pessoa, não precisa de um
 * toggle separado. Usado em qualquer lugar que exibe o nome principal de
 * um usuário/cliente/profissional (header, listas, avatares, seletores);
 * o nome de registro continua disponível nos formulários/dados fiscais.
 */
export function displayName(entity: { name: string; socialName?: string | null }): string {
  return entity.socialName?.trim() || entity.name;
}
