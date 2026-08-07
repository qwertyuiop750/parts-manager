import { useMemo, useState } from "react";
import { useParams, Navigate, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Circle,
  CheckCheck,
  AlertTriangle,
  Package,
  Printer,
} from "lucide-react";
import { usePartsStore } from "@/store/usePartsStore";
import { locationPath, isLowStock, formatDateTime } from "@/utils/format";
import Layout from "@/components/Layout";
import { cn } from "@/lib/utils";
import type { PickTask } from "@/types";

export default function PickTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const task = usePartsStore((s) => s.pickTasks.find((t) => t.id === id));
  const parts = usePartsStore((s) => s.parts);
  const togglePickItem = usePartsStore((s) => s.togglePickItem);
  const completePickTask = usePartsStore((s) => s.completePickTask);

  const [error, setError] = useState("");

  // 按库区分组并排序，方便规划取件路线
  const grouped = useMemo(() => {
    if (!task) return [];
    const items = task.items.map((it) => {
      const part = parts.find((p) => p.id === it.partId);
      return { it, part };
    });
    const valid = items.filter((x) => x.part);
    const map = new Map<string, typeof valid>();
    valid.forEach((x) => {
      const zone = x.part!.zone || "未分区";
      if (!map.has(zone)) map.set(zone, []);
      map.get(zone)!.push(x);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "zh"));
  }, [task, parts]);

  const foundCount = task?.items.filter((it) => it.found).length ?? 0;
  const total = task?.items.length ?? 0;
  const allFound = foundCount === total && total > 0;
  const isDone = task?.status === "done";

  // 库存不足预警
  const stockIssues = useMemo(() => {
    if (!task) return [];
    return task.items
      .map((it) => {
        const part = parts.find((p) => p.id === it.partId);
        if (!part) return null;
        if (it.quantity > part.quantity) {
          return { name: part.name, need: it.quantity, have: part.quantity, unit: part.unit };
        }
        return null;
      })
      .filter(Boolean) as { name: string; need: number; have: number; unit: string }[];
  }, [task, parts]);

  if (!id || !task) {
    return <Navigate to="/assemblies" replace />;
  }

  const handleComplete = () => {
    setError("");
    const result = completePickTask(task.id);
    if (!result.ok) {
      setError(result.reason || "完成失败");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="max-w-3xl animate-fade-up">
        {/* 顶部 */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() => navigate("/assemblies")}
            className="flex items-center gap-1.5 text-sm text-steel-600 hover:text-steel-900"
          >
            <ArrowLeft size={18} />
            返回清单
          </button>
          {isDone && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-steel-600 bg-steel-100 hover:bg-steel-200 rounded-sm transition-colors"
            >
              <Printer size={15} />
              打印领料单
            </button>
          )}
        </div>

        {/* 任务概览 */}
        <div
          className={cn(
            "rounded-sm p-5 mb-5 border-2",
            isDone
              ? "bg-green-50 border-green-300"
              : "bg-hazard-400 border-hazard-500"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isDone ? (
                  <CheckCheck size={20} className="text-green-600" />
                ) : (
                  <Package size={20} className="text-steel-900/70" />
                )}
                <h2 className="text-xl font-bold text-steel-900 truncate">
                  {task.assemblyName}
                </h2>
              </div>
              <p className="text-sm text-steel-800/70 mt-1">
                领用人：{task.receiver || "—"}
                {isDone && task.completedAt && (
                  <span className="ml-3 font-mono-num">
                    完成：{formatDateTime(task.completedAt)}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold font-mono-num text-steel-900">
                {foundCount}
                <span className="text-lg text-steel-700/60">/{total}</span>
              </p>
              <p className="text-xs text-steel-800/70">已找到</p>
            </div>
          </div>
          {/* 进度条 */}
          <div className="mt-3 h-2 bg-steel-900/15 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isDone ? "bg-green-500" : "bg-steel-900"
              )}
              style={{ width: `${total ? (foundCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* 库存不足预警 */}
        {!isDone && stockIssues.length > 0 && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-sm p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
              <AlertTriangle size={16} />
              以下配件库存不足，完成领料时会失败
            </div>
            <ul className="space-y-1 text-sm text-red-600">
              {stockIssues.map((s, i) => (
                <li key={i} className="font-mono-num">
                  {s.name}：需 {s.need} {s.unit}，现有 {s.have} {s.unit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 完成领料按钮 */}
        {!isDone && (
          <button
            onClick={handleComplete}
            disabled={!allFound}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 mb-5 text-base font-bold rounded-sm transition-colors",
              allFound
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-steel-200 text-steel-400 cursor-not-allowed"
            )}
          >
            <CheckCheck size={20} strokeWidth={2.5} />
            {allFound ? "全部已找到，完成领料" : `还需找到 ${total - foundCount} 项`}
          </button>
        )}
        {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}

        {/* 按库区分组的领料清单 */}
        <div className="space-y-6">
          {grouped.map(([zone, items]) => (
            <div key={zone}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-hazard-600" />
                <h3 className="font-bold text-steel-800">{zone}</h3>
                <span className="text-xs text-steel-400 font-mono-num">
                  {items.filter((x) => x.it.found).length}/{items.length}
                </span>
              </div>
              <ul className="space-y-3">
                {items.map(({ it, part }) => {
                  if (!part) return null;
                  const low = isLowStock(part);
                  const insufficient = it.quantity > part.quantity;
                  return (
                    <li
                      key={it.partId}
                      className={cn(
                        "bg-white border-2 rounded-sm overflow-hidden transition-all",
                        it.found
                          ? "border-green-300 opacity-70"
                          : insufficient
                          ? "border-red-200"
                          : "border-steel-200"
                      )}
                    >
                      {/* 位置条 - 最显眼 */}
                      <div
                        className={cn(
                          "px-4 py-3 flex items-center gap-3",
                          it.found ? "bg-green-100" : "bg-hazard-100"
                        )}
                      >
                        <span className="font-mono-num font-bold text-lg text-steel-900 break-all flex-1">
                          {locationPath(part)}
                        </span>
                        {part.image && (
                          <img
                            src={part.image}
                            alt={part.name}
                            className="w-12 h-12 rounded-sm object-cover border border-steel-300 shrink-0"
                          />
                        )}
                      </div>
                      {/* 详情 + 操作 */}
                      <div className="p-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-steel-800">
                              {part.name}
                            </span>
                            <span className="text-sm font-mono-num text-steel-500">
                              {part.spec}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-sm">
                            <span className="text-steel-600">
                              需领：
                              <span className="font-bold font-mono-num text-steel-900">
                                {it.quantity}
                              </span>
                              {part.unit}
                            </span>
                            <span
                              className={cn(
                                "font-mono-num",
                                insufficient
                                  ? "text-red-600 font-bold"
                                  : low
                                  ? "text-red-500"
                                  : "text-steel-400"
                              )}
                            >
                              库存 {part.quantity}
                              {part.unit}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => togglePickItem(task.id, it.partId)}
                          disabled={isDone}
                          className={cn(
                            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-sm transition-colors shrink-0",
                            it.found
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-hazard-400 text-steel-900 hover:bg-hazard-300",
                            isDone && "cursor-not-allowed opacity-60"
                          )}
                        >
                          {it.found ? (
                            <>
                              <CheckCircle2 size={18} />
                              已找到
                            </>
                          ) : (
                            <>
                              <Circle size={18} />
                              未找到
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* 完成后跳转 */}
        {isDone && (
          <div className="mt-6 text-center">
            <Link
              to="/assemblies"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-hazard-400 text-steel-900 hover:bg-hazard-300 rounded-sm transition-colors"
            >
              返回清单列表
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
