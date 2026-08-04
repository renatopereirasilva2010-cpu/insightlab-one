import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

/**
 * Server-safe por design: NÃO leva "use client". Várias páginas (Server
 * Components) passam `columns` com funções de render direto pra cá - se este
 * componente virasse Client Component, essas funções não sobreviveriam à
 * fronteira RSC ("Functions cannot be passed directly to Client Components")
 * e quebraria todo mundo que usa DataTable, não só quem precisa de
 * paginação. Paginação client-side, quando necessária, é responsabilidade de
 * quem já é "use client" (ver import-data-panel.tsx: ele mesmo pagina as
 * rows antes de repassar pra este componente).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Nenhum registro encontrado.",
  emptyAction,
  onRowClick,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  /** Quando presente, clicar em qualquer célula da linha (fora de botões que chamam stopPropagation) dispara isto. */
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        <p>{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.header} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              {columns.map((col) => (
                <TableCell key={col.header} className={col.className}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
