"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: React.ReactNode;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart deve ser usado dentro de <ChartContainer>");
  return context;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const style = Object.fromEntries(
    Object.entries(config)
      .filter(([, v]) => v.color)
      .map(([key, v]) => [`--color-${key}`, v.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 aspect-video w-full text-xs",
          className,
        )}
        style={style}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string }>;
  label?: string;
  formatter?: (value: number | string) => string;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover text-popover-foreground grid min-w-[9rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-md">
      {label && <p className="font-medium">{label}</p>}
      {payload.map((item, i) => {
        const key = item.dataKey ?? item.name ?? String(i);
        const entryConfig = config[key as string];
        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ background: item.color }}
              />
              {entryConfig?.label ?? item.name}
            </span>
            <span className="text-foreground font-mono font-medium">
              {formatter && item.value !== undefined ? formatter(item.value) : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;
