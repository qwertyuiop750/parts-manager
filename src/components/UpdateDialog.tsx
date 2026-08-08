import { useEffect } from "react";
import { Download, X, ExternalLink } from "lucide-react";
import type { UpdateInfo } from "@/utils/updater";

interface UpdateDialogProps {
  open: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
  onDownload: () => void;
}

export default function UpdateDialog({
  open,
  updateInfo,
  onClose,
  onDownload,
}: UpdateDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !updateInfo) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="cyber-card rounded-sm shadow-[0_0_30px_rgba(0,240,255,0.15)] w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neon-cyan/20">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 bg-neon-green/15 text-neon-green border border-neon-green/30 rounded-sm">
              <Download size={18} />
            </div>
            <div>
              <h3 className="font-bold text-steel-200">发现新版本</h3>
              <p className="text-xs text-steel-400 font-mono-num">
                {updateInfo.currentVersion} → {updateInfo.latestVersion}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-steel-500 hover:text-neon-cyan"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {updateInfo.releaseNotes && (
            <div>
              <p className="text-sm font-medium text-steel-300 mb-2">更新内容：</p>
              <div className="text-sm text-steel-400 bg-steel-900/50 border border-neon-cyan/10 rounded-sm p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {updateInfo.releaseNotes}
              </div>
            </div>
          )}

          {updateInfo.publishedAt && (
            <p className="text-xs text-steel-500 font-mono-num">
              发布时间：{formatDate(updateInfo.publishedAt)}
            </p>
          )}

          <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-sm p-3">
            <p className="text-xs text-neon-cyan">
              点击"立即更新"后，将在浏览器中下载 APK 安装包。下载完成后点击安装即可。
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-neon-cyan/15">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-steel-400 bg-steel-800 hover:bg-steel-700 border border-steel-700 rounded-sm transition-colors"
          >
            稍后再说
          </button>
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold neon-btn rounded-sm"
          >
            <ExternalLink size={15} />
            立即更新
          </button>
        </div>
      </div>
    </div>
  );
}
