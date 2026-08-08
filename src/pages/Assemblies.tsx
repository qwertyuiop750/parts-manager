import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  ArrowLeft,
  ClipboardList,
  Package,
  Camera,
} from "lucide-react";
import type { AssemblyList } from "@/types";
import { usePartsStore } from "@/store/usePartsStore";
import { formatDateTime, locationPath } from "@/utils/format";
import Layout from "@/components/Layout";
import AssemblyForm from "@/components/AssemblyForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import PhotoImportDialog from "@/components/PhotoImportDialog";

export default function Assemblies() {
  const navigate = useNavigate();
  const assemblies = usePartsStore((s) => s.assemblies);
  const parts = usePartsStore((s) => s.parts);
  const deleteAssembly = usePartsStore((s) => s.deleteAssembly);
  const startPickTask = usePartsStore((s) => s.startPickTask);

  const [editing, setEditing] = useState<
    { mode: "add" } | { mode: "edit"; assembly: AssemblyList } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<AssemblyList | null>(null);
  const [pickTarget, setPickTarget] = useState<AssemblyList | null>(null);
  const [receiver, setReceiver] = useState("");
  const [photoOpen, setPhotoOpen] = useState(false);

  const handleStartPick = () => {
    if (!pickTarget) return;
    if (!receiver.trim()) {
      alert("请输入领用人");
      return;
    }
    const task = startPickTask(pickTarget.id, receiver);
    if (!task) {
      alert("清单为空，无法领料");
      return;
    }
    setPickTarget(null);
    setReceiver("");
    navigate(`/pick/${task.id}`);
  };

  if (editing) {
    return (
      <Layout>
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 text-sm text-steel-400 hover:text-neon-cyan mb-4"
        >
          <ArrowLeft size={18} />
          返回清单列表
        </button>
        <AssemblyForm
          mode={editing.mode}
          initial={editing.mode === "edit" ? editing.assembly : undefined}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-up">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-sm shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <ClipboardList size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neon-cyan neon-text">组装清单</h2>
              <p className="text-xs text-steel-500">
                定义设备所需配件，一键发起领料核对
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPhotoOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold neon-btn rounded-sm"
            >
              <Camera size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">拍照导入</span>
            </button>
            <button
              onClick={() => setEditing({ mode: "add" })}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold neon-btn rounded-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">新建清单</span>
            </button>
          </div>
        </div>

        {/* 清单列表 */}
        {assemblies.length === 0 ? (
          <div className="cyber-card rounded-sm py-20 text-center">
            <ClipboardList size={40} className="mx-auto text-steel-600 mb-3" />
            <p className="text-steel-400 text-sm">还没有组装清单</p>
            <p className="text-steel-500 text-xs mt-1">
              点击"新建清单"定义一台设备需要的配件
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assemblies.map((a) => {
              const validItems = a.items.filter((it) =>
                parts.some((p) => p.id === it.partId)
              );
              return (
                <div
                  key={a.id}
                  className="cyber-card rounded-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-neon-cyan/15">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-steel-200 truncate">
                          {a.name}
                        </h3>
                        {a.remark && (
                          <p className="text-xs text-steel-500 mt-0.5 truncate">
                            {a.remark}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-neon-cyan font-mono-num bg-neon-cyan/10 px-2 py-0.5 rounded-sm border border-neon-cyan/20">
                        {a.items.length} 项
                      </span>
                    </div>
                  </div>

                  {/* 配件预览 */}
                  <div className="p-4 bg-steel-900/50">
                    {validItems.length === 0 ? (
                      <p className="text-xs text-steel-500">
                        配件已被删除，请编辑清单
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {validItems.slice(0, 4).map((it) => {
                          const p = parts.find((pp) => pp.id === it.partId);
                          if (!p) return null;
                          return (
                            <li
                              key={it.partId}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Package size={12} className="text-steel-500 shrink-0" />
                              <span className="text-steel-300 truncate">
                                {p.name}
                              </span>
                              <span className="font-mono-num text-steel-500">
                                ×{it.quantity}
                              </span>
                              <span className="ml-auto font-mono-num text-neon-cyan bg-neon-cyan/10 px-1.5 py-0.5 rounded-sm border border-neon-cyan/20 truncate max-w-[40%]">
                                {locationPath(p)}
                              </span>
                            </li>
                          );
                        })}
                        {validItems.length > 4 && (
                          <li className="text-xs text-steel-500">
                            还有 {validItems.length - 4} 项…
                          </li>
                        )}
                      </ul>
                    )}
                    <p className="mt-2 text-[11px] text-steel-500 font-mono-num">
                      更新：{formatDateTime(a.updatedAt)}
                    </p>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-1 p-2 border-t border-neon-cyan/15">
                    <button
                      onClick={() => setPickTarget(a)}
                      disabled={validItems.length === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold neon-btn rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Play size={15} strokeWidth={2.5} />
                      开始领料
                    </button>
                    <button
                      onClick={() => setEditing({ mode: "edit", assembly: a })}
                      className="p-2 text-steel-500 hover:text-neon-purple hover:bg-neon-purple/10 rounded-sm transition-colors"
                      title="编辑"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="p-2 text-steel-500 hover:text-neon-pink hover:bg-neon-pink/10 rounded-sm transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 领料确认弹窗 */}
      {pickTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-950/80 backdrop-blur-sm"
          onClick={() => {
            setPickTarget(null);
            setReceiver("");
          }}
        >
          <div
            className="cyber-card rounded-sm shadow-[0_0_30px_rgba(0,240,255,0.15)] w-full max-w-sm animate-scale-in p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-steel-200 mb-1">开始领料</h3>
            <p className="text-sm text-steel-400 mb-4">
              清单：{pickTarget.name}（{pickTarget.items.length} 项）
            </p>
            <label className="text-sm font-medium text-steel-300">
              领用人<span className="text-neon-pink ml-0.5">*</span>
            </label>
            <input
              className="w-full mt-1 px-3 py-2 text-sm cyber-input rounded-sm"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="工人姓名"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setPickTarget(null);
                  setReceiver("");
                }}
                className="flex-1 py-2 text-sm font-medium text-steel-400 bg-steel-800 hover:bg-steel-700 border border-steel-700 rounded-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStartPick}
                className="flex-1 py-2 text-sm font-bold neon-btn rounded-sm"
              >
                开始领料
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除组装清单"
        message={`确认删除清单「${deleteTarget?.name}」？此操作不可撤销。`}
        confirmText="确认删除"
        danger
        onConfirm={() => {
          if (deleteTarget) deleteAssembly(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 拍照导入 */}
      <PhotoImportDialog
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onCreated={() => {
          setPhotoOpen(false);
        }}
      />
    </Layout>
  );
}
