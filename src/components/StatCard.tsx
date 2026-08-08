import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "warning" | "info" | "success";
}

const TONE_STYLES = {
  default: {
    iconBg: "bg-neon-cyan/15 border border-neon-cyan/30",
    iconColor: "text-neon-cyan",
    glow: "shadow-[0_0_15px_rgba(0,240,255,0.1)]",
  },
  warning: {
    iconBg: "bg-neon-pink/15 border border-neon-pink/30",
    iconColor: "text-neon-pink",
    glow: "shadow-[0_0_15px_rgba(255,0,110,0.1)]",
  },
  info: {
    iconBg: "bg-neon-purple/15 border border-neon-purple/30",
    iconColor: "text-neon-purple",
    glow: "shadow-[0_0_15px_rgba(176,38,255,0.1)]",
  },
  success: {
    iconBg: "bg-neon-green/15 border border-neon-green/30",
    iconColor: "text-neon-green",
    glow: "shadow-[0_0_15px_rgba(57,255,20,0.1)]",
  },
};

export default function StatCard({ label, value, icon: Icon, hint, tone = "default" }: StatCardProps) {
  const style = TONE_STYLES[tone];
  return (
    <div className={cn("cyber-card rounded-sm p-4", style.glow)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex items-center justify-center w-12 h-12 rounded-sm", style.iconBg)}>
          <Icon size={24} className={style.iconColor} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-steel-400 mb-0.5">{label}</p>
          <p className={cn("text-2xl font-bold font-mono-num", style.iconColor)}>
            {value}
          </p>
          {hint && <p className="text-[10px] text-steel-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
