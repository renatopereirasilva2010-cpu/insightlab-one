"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityDialog } from "@/components/entity-dialog";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import type { Professional, ProfessionalAvailability } from "@/lib/api-types";
import { queryAvailability } from "./actions";
import { AvailabilityForm } from "./availability-form";

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AvailabilityPanel({ professionals }: { professionals: Professional[] }) {
  const [professionalId, setProfessionalId] = useState<string>(professionals[0]?.id ?? "");
  const [date, setDate] = useState<string>(todayISODate());
  const [rules, setRules] = useState<ProfessionalAvailability[]>([]);
  const [weekday, setWeekday] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [editRule, setEditRule] = useState<ProfessionalAvailability | null>(null);

  async function handleQuery() {
    if (!professionalId || !date) return;
    setLoading(true);
    setError(null);
    const result = await queryAvailability(professionalId, date);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setRules([]);
      setWeekday(null);
      return;
    }
    setRules(result.data.rules);
    setWeekday(result.data.weekday);
  }

  if (professionals.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Cadastre um profissional antes de configurar disponibilidade.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="min-w-56 space-y-1.5">
            <label className="text-sm font-medium">Profissional</label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Data de referência</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <Button onClick={handleQuery} disabled={loading}>
            {loading ? "Buscando..." : "Ver regras do dia"}
          </Button>

          <Button variant="outline" onClick={() => setNewRuleOpen(true)}>
            <Plus />
            Nova regra
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {weekday !== null && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Regras para {WEEKDAY_LABELS[weekday]} (profissional selecionado).
          </p>
          <DataTable<ProfessionalAvailability>
            rows={rules}
            rowKey={(r) => r.id}
            emptyMessage="Nenhuma regra cadastrada para este dia."
            columns={[
              { header: "Início", cell: (r) => r.startTime },
              { header: "Término", cell: (r) => r.endTime },
              { header: "Ativa", cell: (r) => (r.active ? "Sim" : "Não") },
              {
                header: "",
                className: "text-right",
                cell: (r) => (
                  <Button variant="ghost" size="sm" onClick={() => setEditRule(r)}>
                    <Pencil />
                  </Button>
                ),
              },
            ]}
          />
        </div>
      )}

      <EntityDialog
        title="Nova regra de disponibilidade"
        open={newRuleOpen}
        onOpenChange={setNewRuleOpen}
      >
        {({ close }) => (
          <AvailabilityForm
            professionalId={professionalId}
            onSuccess={() => {
              close();
              handleQuery();
            }}
          />
        )}
      </EntityDialog>

      <EntityDialog
        title="Editar regra de disponibilidade"
        open={editRule !== null}
        onOpenChange={(open) => !open && setEditRule(null)}
      >
        {({ close }) =>
          editRule && (
            <AvailabilityForm
              professionalId={professionalId}
              existing={editRule}
              onSuccess={() => {
                close();
                setEditRule(null);
                handleQuery();
              }}
            />
          )
        }
      </EntityDialog>
    </div>
  );
}
