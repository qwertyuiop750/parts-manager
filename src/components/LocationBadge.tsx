import { MapPin } from "lucide-react";
import type { Part } from "@/types";
import { locationPath } from "@/utils/format";
import { cn } from "@/lib/utils";

interface LocationBadgeProps {
  part: Pick<Part, "zone" | "shelf" | "layer" | "bin">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LocationBadge({
  part,
  size = "sm",
  className,
}: LocationBadgeProps) {
  const path = locationPath(part);
  const sizeCls =
    size === "lg"
      ? "text-base px-3 py-1.5"
      : size === "md"
      ? "text-sm px-2.5 py-1"
      : "text-xs px-2 py-0.5";

  if (!path) {
    return <span className="text-steel-500 text-xs">未设置</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono-num font-medium",
        "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-sm",
        sizeCls,
        className
      )}
    >
      <MapPin size={size === "lg" ? 16 : 12} strokeWidth={2.5} />
      {path}
    </span>
  );
}
