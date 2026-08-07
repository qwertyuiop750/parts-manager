import type { Part } from "@/types";

/** 生成唯一 ID */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 拼接完整位置路径，如 A区-货架03-第2层-A位 */
export function locationPath(part: Pick<Part, "zone" | "shelf" | "layer" | "bin">): string {
  return [part.zone, part.shelf, part.layer, part.bin].filter(Boolean).join("-");
}

/** 是否库存预警 */
export function isLowStock(part: Pick<Part, "quantity" | "safetyStock">): boolean {
  return part.quantity <= part.safetyStock;
}

/** 格式化日期时间 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 格式化日期 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 是否今天 */
export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
