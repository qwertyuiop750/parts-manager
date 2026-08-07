import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "info";
  hint?: string;
}

const toneCls: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-steel-800",
  warning: "text-red-600",
  info: "text-blue-600",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: StatCardProps) {
  return (
    <div className="bg-white border border-steel-200 rounded-sm p-4 flex items-center gap-4 hover:border-steel-300 hover:shadow-sm transition-all">
      <div
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-sm shrink-0",
          tone === "warning"
            ? "bg-red-50 text-red-500"
            : tone === "info"
            ? "bg-blue-50 text-blue-500"
            : "bg-hazard-50 text-hazard-600"
        )}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-steel-500 truncate">{label}</p>
        <p className={cn("text-2xl font-bold font-mono-num leading-tight", toneCls[tone])}>
          {value}
        </p>
        {hint && <p className="text-[11px] text-steel-400 truncate">{hint}</p>}
      </div>
    </div>
  );
}
