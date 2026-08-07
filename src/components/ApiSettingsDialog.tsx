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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-sm shadow-2xl w-full max-w-md animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-steel-100">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 bg-hazard-50 text-hazard-600 rounded-sm">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="font-bold text-steel-800">识别接口设置</h3>
              <p className="text-xs text-steel-500">
                配置视觉模型，用于拍照识别配件表格
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-steel-400 hover:text-steel-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* 预设 */}
          <div>
            <p className="text-xs text-steel-500 mb-1.5">快速选择</p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 text-xs text-steel-600 bg-steel-100 hover:bg-hazard-100 hover:text-hazard-700 rounded-sm transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-steel-700">
              接口地址<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              className={`${inputCls} mt-1 font-mono-num text-xs`}
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="https://open.bigmodel.cn/api/paas/v4"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-steel-400">
              OpenAI 兼容接口根路径（无需带 /chat/completions）
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-steel-700">
              API 密钥<span className="text-red-500 ml-0.5">*</span>
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
                className="absolute right-2 top-1/2 -translate-y-1/2 text-steel-400 hover:text-steel-600 p-1"
                title={showKey ? "隐藏" : "显示"}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-steel-400">
              仅保存在本机，不会上传
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-steel-700">
              模型名称<span className="text-red-500 ml-0.5">*</span>
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
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-sm">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-sm">
              已保存
            </p>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-steel-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-steel-600 bg-steel-100 hover:bg-steel-200 rounded-sm transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold bg-hazard-400 text-steel-900 hover:bg-hazard-300 rounded-sm transition-colors"
          >
            <Save size={15} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
