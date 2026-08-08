import { useMemo, useState } from "react";
import { Search, Plus, Trash2, Package } from "lucide-react";
import type { AssemblyList, AssemblyItem } from "@/types";
import { usePartsStore } from "@/store/usePartsStore";
import { locationPath } from "@/utils/format";
import { inputCls } from "@/components/form/Field";
import LocationBadge from "@/components/LocationBadge";

interface AssemblyFormProps {
  mode: "add" | "edit";
  initial?: AssemblyList;
  onDone: () => void;
  onCancel: () => void;
}

export default function AssemblyForm({
  mode,
  initial,
  onDone,
  onCancel,
}: AssemblyFormProps) {
  const parts = usePartsStore((s) => s.parts);
  const addAssembly = usePartsStore((s) => s.addAssembly);
  const updateAssembly = usePartsStore((s) => s.updateAssembly);

  const [name, setName] = useState(initial?.name ?? "");
  const [remark, setRemark] = useState(initial?.remark ?? "");
  const [items, setItems] = useState<AssemblyItem[]>(initial?.items ?? []);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const addedIds = useMemo(
    () => new Set(items.map((it) => it.partId)),
    [items]
  );

  const searchResults = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return parts
      .filter((p) => !addedIds.has(p.id))
      .filter(
        (p) =>
          !kw ||
          [p.name, p.spec, p.zone, p.shelf]
            .some((v) => v.toLowerCase().includes(kw))
      )
      .slice(0, 8);
  }, [parts, addedIds, search]);

  const addItem = (partId: string) => {
    setItems((prev) => [...prev, { partId, quantity: 1 }]);
    setSearch("");
  };

  const setQty = (partId: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.partId === partId ? { ...it, quantity: Math.max(1, qty) } : it
      )
    );
  };

  const removeItem = (partId: string) => {
    setItems((prev) => prev.filter((it) => it.partId !== partId));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("请输入设备名称");
      return;
    }
    if (items.length === 0) {
      setError("请至少添加一个配件");
      return;
    }
    if (mode === "edit" && initial) {
      updateAssembly(initial.id, name, remark, items);
    } else {
      addAssembly(name, remark, items);
    }
    onDone();
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="bg-white border border-steel-200 rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-steel-50 border-b border-steel-200">
          <Package size={18} className="text-hazard-600" />
          <h2 className="font-bold text-steel-800">
            {mode === "edit" ? "编辑组装清单" : "新建组装清单"}
          </h2>
        </div>
        <div className="p-5 space-y-5">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-steel-700">
                设备名称<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                className={`${inputCls} mt-1`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="如：装配机A型"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-steel-700">备注</label>
              <input
                className={`${inputCls} mt-1`}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="选填"
              />
            </div>
          </div>

          {/* 添加配件 */}
          <div>
            <label className="text-sm font-medium text-steel-700">
              添加配件到清单
            </label>
            <div className="relative mt-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400"
              />
              <input
                className={`${inputCls} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索配件名/规格/位置后点击添加"
              />
              {search && searchResults.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-steel-200 rounded-sm shadow-lg max-h-64 overflow-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hazard-50 border-b border-steel-100 last:border-0"
                    >
                      <Plus size={14} className="text-hazard-600 shrink-0" />
                      <span className="text-sm font-medium text-steel-800">
                        {p.name}
                      </span>
                      <span className="text-xs font-mono-num text-steel-500">
                        {p.spec}
                      </span>
                      <span className="ml-auto text-xs text-steel-400 font-mono-num">
                        {locationPath(p)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {search && searchResults.length === 0 && (
                <p className="mt-1 text-xs text-steel-400">
                  没有可添加的配件
                </p>
              )}
            </div>
          </div>

          {/* 已选配件列表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-steel-700">
                清单配件
                <span className="ml-1 text-xs text-steel-400 font-mono-num">
                  ({items.length})
                </span>
              </p>
            </div>
            {items.length === 0 ? (
              <p className="text-center text-steel-400 text-sm py-8 bg-steel-50 rounded-sm">
                还未添加配件
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => {
                  const p = parts.find((pp) => pp.id === it.partId);
                  if (!p) return null;
                  return (
                    <li
                      key={it.partId}
                      className="flex items-center gap-3 p-3 bg-steel-50 rounded-sm border border-steel-100"
                    >
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-sm object-cover border border-steel-200 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-steel-800 text-sm">
                            {p.name}
                          </span>
                          <span className="text-xs font-mono-num text-steel-500">
                            {p.spec}
                          </span>
                        </div>
                        <div className="mt-1">
                          <LocationBadge part={p} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            setQty(it.partId, Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-sm text-center font-mono-num bg-white border border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400"
                        />
                        <span className="text-xs text-steel-400">{p.unit}</span>
                      </div>
                      <button
                        onClick={() => removeItem(it.partId)}
                        className="p-1.5 text-steel-400 hover:text-red-500 hover:bg-red-50 rounded-sm"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-2 border-t border-steel-100">
            <button
              onClick={onCancel}
              className="px-5 py-2 text-sm font-medium text-steel-600 bg-steel-100 hover:bg-steel-200 rounded-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-bold bg-hazard-400 text-steel-900 hover:bg-hazard-300 rounded-sm transition-colors"
            >
              保存清单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
