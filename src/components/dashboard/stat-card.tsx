import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  growth?: number;
  icon: LucideIcon;
  iconColor?: string;
};

export function StatCard({ title, value, subtitle, growth, icon: Icon, iconColor = "text-[#f97316]" }: StatCardProps) {
  const isPositive = growth !== undefined && growth > 0;
  const isNegative = growth !== undefined && growth < 0;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--muted-fg)] font-medium uppercase tracking-wide">{title}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-[var(--muted-fg)] mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-2)]", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {growth !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-[var(--muted-fg)]")}>
          {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : isNegative ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {growth > 0 ? "+" : ""}{growth}% vs mês anterior
        </div>
      )}
    </Card>
  );
}
