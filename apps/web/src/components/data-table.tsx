"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Nenhum registro encontrado.",
  emptyAction,
  onRowClick,
  pageSize,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  /** Quando presente, clicar em qualquer célula da linha (fora de botões que chamam stopPropagation) dispara isto. */
  onRowClick?: (row: T) => void;
  /**
   * Quando presente, pagina no client em vez de jogar todas as linhas no DOM
   * de uma vez - listas grandes (ex.: revisão de importação de planilha real,
   * centenas de linhas) travavam a aba. Sem esse prop, comportamento
   * inalterado (todas as linhas, sem paginação) - onda12.
   */
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        <p>{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  const totalPages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages - 1);
  const visibleRows = pageSize ? rows.slice(currentPage * pageSize, currentPage * pageSize + pageSize) : rows;

  return (
    <div className="space-y-2">
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
            {visibleRows.map((row) => (
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

      {pageSize && rows.length > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, rows.length)} de {rows.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
