import { useEffect, useState } from "react";
import { X, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import {
  getApiConfig,
  setApiConfig,
  type ApiConfig,
} from "@/utils/aiVision";
import { inputCls } from "@/components/form/Field";

interface ApiSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const DEFAULT_PRESETS: { label: string; baseURL: string; model: string }[] = [
  {
    label: "智谱 GLM-4V",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4v-plus",
  },
  {
    label: "OpenAI GPT-4o",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o",
  },
  {
    label: "通义千问 VL",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-vl-max",
  },
];

export default function ApiSettingsDialog({
  open,
  onClose,
  onSaved,
}: ApiSettingsDialogProps) {
  const [baseURL, setBaseURL] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cfg = getApiConfig();
    if (cfg) {
      setBaseURL(cfg.baseURL);
      setApiKey(cfg.apiKey);
      setModel(cfg.model);
    }
    setError("");
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

  const handleSave = () => {
    if (!baseURL.trim()) {
      setError("请填写接口地址");
      return;
    }
    if (!apiKey.trim()) {
      setError("请填写 API 密钥");
      return;
    }
    if (!model.trim()) {
      setError("请填写模型名称");
      return;
    }
    const cfg: ApiConfig = {
      baseURL: baseURL.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    };
    setApiConfig(cfg);
    setSaved(true);
    setTimeout(() => {
      onSaved?.();
      onClose();
    }, 700);
  };

  const applyPreset = (preset: (typeof DEFAULT_PRESETS)[number]) => {
    setBaseURL(preset.baseURL);
    setModel(preset.model);
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
            <div className="flex items-center justify-center w-9 h-9 bg-neon-purple/15 text-neon-purple border border-neon-purple/30 rounded-sm">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="font-bold text-steel-200">识别接口设置</h3>
              <p className="text-xs text-steel-400">
                配置视觉模型，用于拍照识别配件表格
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
          {/* 预设 */}
          <div>
            <p className="text-xs text-steel-400 mb-1.5">快速选择</p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 text-xs text-steel-300 bg-steel-800 hover:bg-neon-purple/15 hover:text-neon-purple border border-neon-purple/20 rounded-sm transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-steel-300">
              接口地址<span className="text-neon-pink ml-0.5">*</span>
            </label>
            <input
              className={`${inputCls} mt-1 font-mono-num text-xs`}
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="https://open.bigmodel.cn/api/paas/v4"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-steel-500">
              OpenAI 兼容接口根路径（无需带 /chat/completions）
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-steel-300">
              API 密钥<span className="text-neon-pink ml-0.5">*</span>
            </label>
            <div className="relative mt-1">
              <input
                className={`${inputCls} pr-10 font-mono-num text-xs`}
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-steel-500 hover:text-neon-cyan p-1"
                title={showKey ? "隐藏" : "显示"}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-steel-500">
              仅保存在本机，不会上传
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-steel-300">
              模型名称<span className="text-neon-pink ml-0.5">*</span>
            </label>
            <input
              className={`${inputCls} mt-1 font-mono-num text-xs`}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="glm-4v-plus"
              autoComplete="off"
              spellCheck={false}
            />
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
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-steel-400 bg-steel-800 hover:bg-steel-700 border border-steel-700 rounded-sm transition-colors"
          >
            取消
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
