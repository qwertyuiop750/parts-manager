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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-900/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-sm shadow-2xl w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-sm shrink-0 ${
              danger ? "bg-red-50 text-red-500" : "bg-hazard-50 text-hazard-600"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-steel-800">{title}</h3>
            <p className="mt-1 text-sm text-steel-600 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-steel-400 hover:text-steel-600 shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2 p-4 border-t border-steel-100">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium text-steel-600 bg-steel-100 hover:bg-steel-200 rounded-sm transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-sm font-bold rounded-sm transition-colors ${
              danger
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-hazard-400 text-steel-900 hover:bg-hazard-300"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
