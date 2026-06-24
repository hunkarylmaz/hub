import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent = "violet",
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  accent?: "violet" | "navy" | "emerald" | "amber";
}) {
  const accentClasses = {
    violet: "bg-violet-50 text-violet-600",
    navy: "bg-navy-100 text-navy-700",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  }[accent];

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        {Icon && (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accentClasses)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-navy-900">{value}</p>
      {trend !== undefined && (
        <p className={cn("mt-1.5 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-red-600")}>
          {trend >= 0 ? "+" : ""}
          {trend}% {trendLabel}
        </p>
      )}
    </div>
  );
}
