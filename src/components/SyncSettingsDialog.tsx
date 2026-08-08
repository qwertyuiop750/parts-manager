import { useEffect, useState } from "react";
import { X, Save, Cloud, Eye, EyeOff, CheckCircle, Trash2 } from "lucide-react";
import {
  getSyncConfig,
  setSyncConfig,
  clearSyncConfig,
  validateSyncConfig,
  type SyncConfig,
} from "@/utils/sync";
import { inputCls } from "@/components/form/Field";

interface SyncSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SyncSettingsDialog({
  open,
  onClose,
  onSaved,
}: SyncSettingsDialogProps) {
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cfg = getSyncConfig();
    if (cfg) {
      setToken(cfg.token);
      setOwner(cfg.owner);
      setRepo(cfg.repo);
      setBranch(cfg.branch || "main");
    } else {
      setToken("");
      setOwner("");
      setRepo("");
      setBranch("main");
    }
    setError("");
    setValidated(null);
    setSaved(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleValidate = async () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) {
      setError("请填写 Token、用户名和仓库名");
      return;
    }
    setValidating(true);
    setError("");
    try {
      const cfg: SyncConfig = {
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || "main",
      };
      const ok = await validateSyncConfig(cfg);
      setValidated(ok);
      if (!ok) setError("验证失败：Token 无权限或仓库不存在");
    } catch {
      setValidated(false);
      setError("网络错误，无法验证");
    } finally {
      setValidating(false);
    }
  };

  const handleSave = () => {
    if (!token.trim()) {
      setError("请填写 Token");
      return;
    }
    if (!owner.trim() || !repo.trim()) {
      setError("请填写用户名和仓库名");
      return;
    }
    const cfg: SyncConfig = {
      token: token.trim(),
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim() || "main",
    };
    setSyncConfig(cfg);
    setSaved(true);
    setTimeout(() => {
      onSaved?.();
      onClose();
    }, 700);
  };

  const handleClear = () => {
    if (!confirm("确定清除同步配置？")) return;
    clearSyncConfig();
    setToken("");
    setOwner("");
    setRepo("");
    setBranch("main");
    setValidated(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="cyber-card rounded-sm shadow-[0_0_30px_rgba(0,240,255,0.15)] w-full max-w-md animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neon-cyan/20">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 rounded-sm">
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="font-bold text-steel-200">云端同步设置</h3>
              <p className="text-xs text-steel-400">
                通过 GitHub 仓库同步数据到其他设备
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

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-steel-300">
              GitHub Token<span className="text-neon-pink ml-0.5">*</span>
            </label>
            <div className="relative mt-1">
              <input
                className={`${inputCls} pr-16 font-mono-num text-xs`}
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setValidated(null);
                }}
                placeholder="ghp_xxxxxxxxxxxx"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="text-steel-500 hover:text-neon-cyan p-1"
                  title={showToken ? "隐藏" : "显示"}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {validated === true && (
                  <CheckCircle size={14} className="text-neon-green" />
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-steel-500">
              需要 repo 权限，在 GitHub Settings → Developer settings → Personal access tokens 生成
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-steel-300">
                用户名<span className="text-neon-pink ml-0.5">*</span>
              </label>
              <input
                className={`${inputCls} mt-1 text-xs`}
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setValidated(null);
                }}
                placeholder="qwertyuiop750"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-steel-300">
                仓库名<span className="text-neon-pink ml-0.5">*</span>
              </label>
              <input
                className={`${inputCls} mt-1 text-xs`}
                value={repo}
                onChange={(e) => {
                  setRepo(e.target.value);
                  setValidated(null);
                }}
                placeholder="parts-manager"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-steel-300">
              分支
            </label>
            <input
              className={`${inputCls} mt-1 text-xs`}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-steel-500">默认 main 分支</p>
          </div>

          {error && (
            <p className="text-xs text-neon-pink bg-neon-pink/10 border border-neon-pink/20 px-3 py-2 rounded-sm">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-xs text-neon-green bg-neon-green/10 border border-neon-green/20 px-3 py-2 rounded-sm">
              已保存
            </p>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-neon-cyan/15">
          {getSyncConfig() && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-neon-pink hover:bg-neon-pink/10 border border-neon-pink/20 rounded-sm transition-colors"
              title="清除配置"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={handleValidate}
            disabled={validating}
            className="flex-1 py-2 text-sm font-medium text-steel-400 bg-steel-800 hover:bg-steel-700 border border-steel-700 rounded-sm transition-colors disabled:opacity-50"
          >
            {validating ? "验证中…" : "验证连接"}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold neon-btn rounded-sm"
          >
            <Save size={15} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
