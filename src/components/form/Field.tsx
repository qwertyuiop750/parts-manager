import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** 表单字段：标签 + 内容 + 提示/错误 */
export default function Field({
  label,
  required = false,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-steel-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-steel-400">{hint}</p>
      ) : null}
    </div>
  );
}

/** 通用输入框样式 */
export const inputCls =
  "w-full px-3 py-2 text-sm bg-white border border-steel-300 rounded-sm " +
  "focus:outline-none focus:border-hazard-400 focus:ring-1 focus:ring-hazard-400 " +
  "placeholder:text-steel-400 transition-colors";
