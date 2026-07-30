import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Form GET simples (sem "use client") - recarrega a pagina com ?from=&to=
 * na URL. Server component consegue ler o intervalo direto de searchParams,
 * sem precisar de estado client-side.
 */
export function DateRangeForm({
  action,
  from,
  to,
}: {
  action: string;
  from: string;
  to: string;
}) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs">
          De
        </Label>
        <Input id="from" name="from" type="date" defaultValue={from} className="w-40" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">
          Até
        </Label>
        <Input id="to" name="to" type="date" defaultValue={to} className="w-40" />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Aplicar período
      </Button>
    </form>
  );
}

export function defaultDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export function parseDateRange(
  searchParams: { from?: string; to?: string },
  defaultDays: number,
): { from: string; to: string; fromDate: Date; toDate: Date } {
  const defaults = defaultDateRange(defaultDays);
  const from = searchParams.from ?? defaults.from;
  const to = searchParams.to ?? defaults.to;
  return {
    from,
    to,
    fromDate: new Date(`${from}T00:00:00`),
    toDate: new Date(`${to}T23:59:59.999`),
  };
}
