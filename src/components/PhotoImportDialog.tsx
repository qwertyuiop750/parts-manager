import { useEffect, useRef, useState } from "react";
import {
  X,
  Camera,
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { usePartsStore } from "@/store/usePartsStore";
import {
  getApiConfig,
  recognizeTable,
  matchPart,
  type RecognizedItem,
} from "@/utils/aiVision";
import { captureImage, compressDataUrl } from "@/utils/camera";
import { inputCls } from "@/components/form/Field";
import { locationPath } from "@/utils/format";
import type { AssemblyItem } from "@/types";
import ApiSettingsDialog from "@/components/ApiSettingsDialog";

interface PhotoImportDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (assemblyId: string) => void;
}

type Step = "capture" | "recognizing" | "review" | "done";

interface ReviewRow {
  item: RecognizedItem;
  partId: string | null;
  matched: "exact" | "name" | "none";
}

export default function PhotoImportDialog({
  open,
  onClose,
  onCreated,
}: PhotoImportDialogProps) {
  const parts = usePartsStore((s) => s.parts);
  const addAssembly = usePartsStore((s) => s.addAssembly);

  const [step, setStep] = useState<Step>("capture");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [listName, setListName] = useState("");
  const [listRemark, setListRemark] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("capture");
    setImage(null);
    setError("");
    setRows([]);
    setListName("");
    setListRemark("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !settingsOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, settingsOpen]);

  if (!open) return null;

  // 拍照（原生）或选择文件（Web）
  const handleCapture = async () => {
    setError("");
    try {
      const data = await captureImage();
      if (data) {
        setImage(data);
        await runRecognize(data);
      } else {
        // Web 端：触发文件选择
        fileRef.current?.click();
      }
    } catch (e) {
      setError((e as Error).message || "拍照失败");
    }
  };

  const handleFile = async (file: File) => {
    setError("");
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsDataURL(file);
      });
      const compressed = await compressDataUrl(dataUrl, 1280, 0.85);
      setImage(compressed);
      await runRecognize(compressed);
    } catch (e) {
      setError((e as Error).message || "图片处理失败");
    }
  };

  const runRecognize = async (imageDataUrl: string) => {
    setStep("recognizing");
    setError("");
    const config = getApiConfig();
    if (!config) {
      setStep("capture");
      setSettingsOpen(true);
      return;
    }
    try {
      const items = await recognizeTable(imageDataUrl, config);
      if (items.length === 0) {
        setError("未识别到配件表格，请重新拍照或换一张图");
        setStep("capture");
        return;
      }
      const newRows: ReviewRow[] = items.map((item) => {
        const r = matchPart(item, parts);
        return { item, partId: r.partId, matched: r.matched };
      });
      setRows(newRows);
      const now = new Date();
      const ts = `${now.getMonth() + 1}/${now.getDate()} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setListName(`拍照导入 ${ts}`);
      setStep("review");
    } catch (e) {
      setError((e as Error).message || "识别失败，请检查接口配置");
      setStep("capture");
    }
  };

  const updateRow = (idx: number, patch: Partial<ReviewRow>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const matchedCount = rows.filter((r) => r.partId).length;

  const handleCreate = () => {
    if (!listName.trim()) {
      setError("请填写清单名称");
      return;
    }
    if (matchedCount === 0) {
      setError("没有已匹配的配件，无法生成清单");
      return;
    }
    // 合并相同 partId 的数量
    const map = new Map<string, number>();
    for (const r of rows) {
      if (!r.partId) continue;
      map.set(r.partId, (map.get(r.partId) ?? 0) + Math.max(1, r.item.quantity));
    }
    const items: AssemblyItem[] = Array.from(map.entries()).map(
      ([partId, quantity]) => ({ partId, quantity })
    );
    const asm = addAssembly(listName.trim(), listRemark.trim(), items);
    setStep("done");
    setTimeout(() => {
      onCreated?.(asm.id);
      onClose();
    }, 900);
  };

  const reset = () => {
    setStep("capture");
    setImage(null);
    setError("");
    setRows([]);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-steel-900/60 backdrop-blur-sm"
        onClick={() => {
          if (step !== "recognizing") onClose();
        }}
      >
        <div
          className="bg-white rounded-t-sm sm:rounded-sm shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-steel-100">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 bg-hazard-50 text-hazard-600 rounded-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-steel-800">拍照导入清单</h3>
                <p className="text-xs text-steel-500">
                  拍配件表格，自动生成组装清单
                </p>
              </div>
            </div>
            {step !== "recognizing" && (
              <button
                onClick={onClose}
                className="text-steel-400 hover:text-steel-600 p-1"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* 步骤条 */}
          <div className="flex items-center px-4 py-2 bg-steel-50 border-b border-steel-100 text-xs">
            <StepDot active={step === "capture"} done={step !== "capture"} n={1} label="拍照" />
            <StepLine done={step === "review" || step === "done"} />
            <StepDot
              active={step === "recognizing"}
              done={step === "review" || step === "done"}
              n={2}
              label="识别"
            />
            <StepLine done={step === "done"} />
            <StepDot active={step === "review"} done={step === "done"} n={3} label="核对" />
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto">
            {step === "capture" && (
              <div className="p-5">
                {image && (
                  <div className="mb-4">
                    <img
                      src={image}
                      alt="待识别"
                      className="w-full max-h-64 object-contain rounded-sm border border-steel-200"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCapture}
                    className="flex flex-col items-center justify-center gap-2 py-6 bg-hazard-400 text-steel-900 hover:bg-hazard-300 rounded-sm transition-colors"
                  >
                    <Camera size={28} strokeWidth={2.5} />
                    <span className="text-sm font-bold">拍照</span>
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 py-6 bg-steel-100 text-steel-700 hover:bg-steel-200 rounded-sm transition-colors"
                  >
                    <ImagePlus size={28} strokeWidth={2.5} />
                    <span className="text-sm font-bold">相册选择</span>
                  </button>
                </div>
                <p className="mt-3 text-xs text-steel-400 text-center">
                  拍一张打印好的配件表格，AI 自动提取名称、规格、数量
                </p>
                {error && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-sm">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="mt-3 w-full text-xs text-steel-500 hover:text-hazard-600 underline underline-offset-2"
                >
                  识别接口设置
                </button>
              </div>
            )}

            {step === "recognizing" && (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <Loader2 size={40} className="text-hazard-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-steel-700">
                  正在识别表格内容…
                </p>
                <p className="text-xs text-steel-400 mt-1">
                  调用视觉模型解析图片，请稍候
                </p>
              </div>
            )}

            {step === "review" && (
              <div className="p-4 space-y-3">
                {/* 清单信息 */}
                <div className="grid grid-cols-1 gap-2">
                  <input
                    className={inputCls}
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="清单名称（如：装配机A型）"
                  />
                  <input
                    className={inputCls}
                    value={listRemark}
                    onChange={(e) => setListRemark(e.target.value)}
                    placeholder="备注（选填）"
                  />
                </div>

                {/* 识别项列表 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-steel-500">
                      共识别 {rows.length} 项
                    </span>
                    <span
                      className={`font-mono-num ${
                        matchedCount === rows.length
                          ? "text-green-600"
                          : "text-hazard-600"
                      }`}
                    >
                      已匹配 {matchedCount}/{rows.length}
                    </span>
                  </div>

                  {rows.map((row, idx) => {
                    const matchedPart = row.partId
                      ? parts.find((p) => p.id === row.partId)
                      : null;
                    return (
                      <div
                        key={idx}
                        className="bg-steel-50 border border-steel-200 rounded-sm p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-steel-800 text-sm truncate">
                              {row.item.name}
                            </p>
                            {row.item.spec && (
                              <p className="text-xs text-steel-500 font-mono-num mt-0.5">
                                规格：{row.item.spec}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-steel-400">×</span>
                            <input
                              type="number"
                              min={1}
                              value={row.item.quantity}
                              onChange={(e) =>
                                updateRow(idx, {
                                  item: {
                                    ...row.item,
                                    quantity:
                                      Math.max(1, parseInt(e.target.value) || 1),
                                  },
                                })
                              }
                              className="w-14 px-2 py-1 text-sm text-center bg-white border border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400 font-mono-num"
                            />
                          </div>
                        </div>

                        {/* 匹配配件选择 */}
                        <div className="mt-2 flex items-center gap-2">
                          <MatchBadge matched={row.matched} hasPart={!!row.partId} />
                          <select
                            value={row.partId ?? ""}
                            onChange={(e) => {
                              const partId = e.target.value || null;
                              const p = partId
                                ? parts.find((pp) => pp.id === partId)
                                : null;
                              updateRow(idx, {
                                partId,
                                matched: p
                                  ? row.matched === "exact"
                                    ? "exact"
                                    : "name"
                                  : "none",
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white border border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400"
                          >
                            <option value="">— 未匹配 —</option>
                            {parts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                                {p.spec ? ` / ${p.spec}` : ""}
                                {p.zone ? ` · ${locationPath(p)}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        {matchedPart && (
                          <p className="mt-1.5 text-[11px] text-hazard-700 font-mono-num">
                            位置：{locationPath(matchedPart) || "未设置"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-sm">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {step === "done" && (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={48} className="text-green-500 mb-3" />
                <p className="text-sm font-bold text-steel-800">清单已生成</p>
                <p className="text-xs text-steel-500 mt-1">
                  已匹配 {matchedCount} 项配件
                </p>
              </div>
            )}
          </div>

          {/* 底部操作 */}
          {step === "review" && (
            <div className="flex gap-2 p-4 border-t border-steel-100">
              <button
                onClick={reset}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-steel-600 bg-steel-100 hover:bg-steel-200 rounded-sm transition-colors"
              >
                <RotateCcw size={15} />
                重拍
              </button>
              <button
                onClick={handleCreate}
                disabled={matchedCount === 0}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold bg-hazard-400 text-steel-900 hover:bg-hazard-300 disabled:bg-steel-200 disabled:text-steel-400 rounded-sm transition-colors"
              >
                生成清单
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 隐藏的文件选择（Web 端） */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <ApiSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}

function StepDot({
  active,
  done,
  n,
  label,
}: {
  active: boolean;
  done: boolean;
  n: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
          done
            ? "bg-green-500 text-white"
            : active
            ? "bg-hazard-400 text-steel-900"
            : "bg-steel-200 text-steel-500"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <span
        className={`${
          active || done ? "text-steel-700 font-medium" : "text-steel-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return (
    <div
      className={`flex-1 h-px mx-2 ${done ? "bg-green-400" : "bg-steel-200"}`}
    />
  );
}

function MatchBadge({
  matched,
  hasPart,
}: {
  matched: "exact" | "name" | "none";
  hasPart: boolean;
}) {
  if (!hasPart) {
    return (
      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-sm">
        未匹配
      </span>
    );
  }
  if (matched === "exact") {
    return (
      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-sm">
        精确
      </span>
    );
  }
  return (
    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-sm">
      名称
    </span>
  );
}
