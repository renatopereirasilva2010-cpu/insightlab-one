"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EntityAvatar } from "@/components/entity-avatar";
import { displayName } from "@/lib/format";
import type { Client } from "@/lib/api-types";

const MAX_RESULTS = 30;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Seletor de cliente pesquisável, sem depender de nenhuma lib nova (cmdk/
 * Popover não existiam no projeto). Nunca renderiza a lista inteira de
 * clientes - só os resultados da busca, com teto de MAX_RESULTS - o Select
 * nativo com milhares de itens (dado real pós-import, onda12) sobrecarrega
 * o React a ponto de o valor selecionado "voltar" sozinho alguns segundos
 * depois (confirmado com log: setValue funciona, mas o state some de novo
 * sob a pressão de render de ~7300 SelectItem).
 */
export function ClientPickerDialog({
  clients,
  value,
  onChange,
  trigger,
}: {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const normalizedQuery = normalize(trimmed);
    const digitsQuery = trimmed.replace(/\D/g, "");
    return clients
      .filter((c) => {
        if (normalize(displayName(c)).includes(normalizedQuery)) return true;
        if (digitsQuery && (c.phone ?? "").replace(/\D/g, "").includes(digitsQuery)) return true;
        return false;
      })
      .slice(0, MAX_RESULTS);
  }, [clients, query]);

  function pick(client: Client) {
    onChange(client.id);
    setOpen(false);
    setQuery("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecionar cliente</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Digite o nome ou telefone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {query.trim() === "" && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Digite para buscar entre {clients.length.toLocaleString("pt-BR")} clientes.
            </p>
          )}
          {query.trim() !== "" && results.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">Nenhum cliente encontrado.</p>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c)}
              className={`hover:bg-muted flex w-full items-center gap-2 rounded-md p-2 text-left text-sm ${
                c.id === value ? "bg-muted" : ""
              }`}
            >
              <EntityAvatar name={displayName(c)} photoUrl={c.photoUrl} />
              <span className="flex flex-col">
                <span>{displayName(c)}</span>
                {c.phone && <span className="text-muted-foreground text-xs">{c.phone}</span>}
              </span>
            </button>
          ))}
          {results.length === MAX_RESULTS && (
            <p className="text-muted-foreground pt-1 text-center text-xs">
              Mostrando os {MAX_RESULTS} primeiros resultados - refine a busca.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
