import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardTone = "gold" | "indigo" | "success" | "warning" | "danger" | "neutral";

const TONE_ICON_STYLE: Record<StatCardTone, React.CSSProperties | undefined> = {
  gold: {
    backgroundColor: "color-mix(in oklch, var(--mix-gold), transparent 85%)",
    color: "var(--mix-gold)",
  },
  indigo: {
    backgroundColor: "color-mix(in oklch, var(--insightlab-indigo-600), transparent 85%)",
    color: "var(--insightlab-indigo-600)",
  },
  success: undefined,
  warning: undefined,
  danger: undefined,
  neutral: undefined,
};

const TONE_ICON_CLASS: Partial<Record<StatCardTone, string>> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-muted text-muted-foreground",
};

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  /** Variação percentual (positiva = alta, negativa = queda). Omitir se não houver comparação. */
  trend?: { value: number; label?: string };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "indigo", trend, className }: StatCardProps) {
  const trendPositive = trend !== undefined && trend.value >= 0;
  return (
    <Card className={cn("shadow-sm transition-shadow hover:shadow-md", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trendPositive ? "text-success" : "text-danger",
              )}
            >
              {trendPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend.value).toFixed(1)}% {trend.label ?? ""}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            TONE_ICON_CLASS[tone],
          )}
          style={TONE_ICON_STYLE[tone]}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
