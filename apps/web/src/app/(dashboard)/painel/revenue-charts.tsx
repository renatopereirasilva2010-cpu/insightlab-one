"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

const trendConfig: ChartConfig = {
  faturamento: { label: "Faturamento", color: "var(--insightlab-violet-600)" },
};

export function RevenueTrendChart({ data }: { data: { date: string; faturamento: number }[] }) {
  const hasData = data.some((d) => d.faturamento > 0);

  return (
    <ChartContainer config={trendConfig} className="aspect-auto h-[220px] w-full">
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillFaturamento" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-faturamento)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-faturamento)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tickFormatter={(v) => formatCurrency(v).replace(/,00$/, "")}
        />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
        <Area
          dataKey="faturamento"
          type="monotone"
          fill="url(#fillFaturamento)"
          stroke="var(--color-faturamento)"
          strokeWidth={2}
        />
      </AreaChart>
      {!hasData && (
        <p className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
          Sem faturamento nos últimos 14 dias ainda.
        </p>
      )}
    </ChartContainer>
  );
}

const breakdownConfig: ChartConfig = {
  total: { label: "Faturamento", color: "var(--insightlab-indigo-600)" },
};

export function RevenueBreakdownChart({ data }: { data: { name: string; total: number }[] }) {
  if (data.length === 0) return null;
  const top = data.slice(0, 6);

  return (
    <ChartContainer config={breakdownConfig} className="aspect-auto h-[160px] w-full">
      <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
