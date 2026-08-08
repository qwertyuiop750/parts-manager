import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-950/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="cyber-card rounded-sm shadow-[0_0_30px_rgba(0,240,255,0.15)] w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-sm shrink-0 ${
              danger
                ? "bg-neon-pink/15 text-neon-pink border border-neon-pink/30"
                : "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-steel-200">{title}</h3>
            <p className="mt-1 text-sm text-steel-400 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-steel-500 hover:text-neon-cyan shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2 p-4 border-t border-neon-cyan/15">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium text-steel-400 bg-steel-800 hover:bg-steel-700 border border-steel-700 rounded-sm transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-sm font-bold rounded-sm transition-colors ${
              danger
                ? "neon-btn-pink"
                : "neon-btn"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
