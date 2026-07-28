"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { Client, Appointment, Attendance } from "@/lib/api-types";

const THRESHOLDS = [30, 45, 60, 90] as const;

function daysSince(date: Date, reference: Date): number {
  return Math.floor((reference.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function DormantClientsPanel({
  clients,
  appointments,
  attendances,
}: {
  clients: Client[];
  appointments: Appointment[];
  attendances: Attendance[];
}) {
  const [thresholdDays, setThresholdDays] = useState<(typeof THRESHOLDS)[number]>(45);

  const lastVisitByClient = useMemo(() => {
    const map = new Map<string, Date>();

    for (const a of appointments) {
      if (a.status === "CANCELED" || a.status === "NO_SHOW") continue;
      const date = new Date(a.startAt);
      const current = map.get(a.clientId);
      if (!current || date > current) map.set(a.clientId, date);
    }

    for (const a of attendances) {
      const reference = a.finishedAt ?? a.startedAt;
      if (!reference) continue;
      const date = new Date(reference);
      const current = map.get(a.clientId);
      if (!current || date > current) map.set(a.clientId, date);
    }

    return map;
  }, [appointments, attendances]);

  const dormantClients = useMemo(() => {
    const now = new Date();
    return clients
      .filter((c) => c.status === "ACTIVE")
      .map((c) => {
        const lastVisit = lastVisitByClient.get(c.id) ?? null;
        const daysAway = lastVisit ? daysSince(lastVisit, now) : null;
        return { client: c, lastVisit, daysAway };
      })
      .filter((entry) => entry.daysAway === null || entry.daysAway >= thresholdDays)
      .sort((a, b) => (b.daysAway ?? Infinity) - (a.daysAway ?? Infinity));
  }, [clients, lastVisitByClient, thresholdDays]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Clientes que sumiram</h2>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {THRESHOLDS.map((days) => (
            <Button
              key={days}
              variant={thresholdDays === days ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setThresholdDays(days)}
            >
              {days}+ dias
            </Button>
          ))}
        </div>
      </div>

      <DataTable<(typeof dormantClients)[number]>
        rows={dormantClients}
        rowKey={(entry) => entry.client.id}
        emptyMessage="Nenhum cliente ativo passou desse período sem aparecer."
        columns={[
          {
            header: "Cliente",
            cell: (entry) => (
              <Link href={`/clientes/${entry.client.id}`} className="underline underline-offset-2">
                {entry.client.name}
              </Link>
            ),
          },
          { header: "Telefone", cell: (entry) => entry.client.phone ?? "—" },
          {
            header: "Última visita",
            cell: (entry) => (entry.lastVisit ? formatDate(entry.lastVisit.toISOString()) : "Nunca veio"),
          },
          {
            header: "Dias sem aparecer",
            cell: (entry) => (entry.daysAway !== null ? entry.daysAway : "—"),
          },
        ]}
      />
    </section>
  );
}
