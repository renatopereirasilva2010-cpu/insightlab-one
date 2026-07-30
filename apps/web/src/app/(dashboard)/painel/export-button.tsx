"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ];
  // BOM pra Excel abrir acentuacao corretamente.
  return "﻿" + lines.join("\n");
}

export function ExportCsvButton({
  rows,
  filename,
  label = "Exportar CSV",
}: {
  rows: Record<string, string | number>[];
  filename: string;
  label?: string;
}) {
  function handleExport() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
      <Download />
      {label}
    </Button>
  );
}
