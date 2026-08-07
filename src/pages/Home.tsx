import { useMemo, useRef, useState } from "react";
import { Search, Package, AlertTriangle, Map, PackageCheck, Filter, X } from "lucide-react";
import { usePartsStore } from "@/store/usePartsStore";
import { isLowStock, isToday } from "@/utils/format";
import { exportData, parseImportFile } from "@/utils/io";
import {
  isSyncConfigured,
  getSyncConfig,
  pullRemoteData,
  pushRemoteData,
  buildExportData,
  mergeRemoteToLocal,
} from "@/utils/sync";
import Layout from "@/components/Layout";
import type { SyncStatus } from "@/components/Layout";
import StatCard from "@/components/StatCard";
import PartsTable from "@/components/PartsTable";
import type { SortKey } from "@/types";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updatedAt", label: "最近更新" },
  { value: "name", label: "名称" },
  { value: "quantity", label: "库存数量" },
];

export default function Home() {
  const parts = usePartsStore((s) => s.parts);
  const outbounds = usePartsStore((s) => s.outbounds);
  const assemblies = usePartsStore((s) => s.assemblies);
  const pickTasks = usePartsStore((s) => s.pickTasks);
  const replaceAll = usePartsStore((s) => s.replaceAll);
  const mergeData = usePartsStore((s) => s.mergeData);

  const [keyword, setKeyword] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    try { return localStorage.getItem("parts_manager_last_sync") || ""; } catch { return ""; }
  });

  // 统计
  const stats = useMemo(() => {
    const zones = new Set(parts.map((p) => p.zone).filter(Boolean));
    const lowCount = parts.filter(isLowStock).length;
    const todayOut = outbounds.filter((o) => isToday(o.timestamp)).length;
    return {
      total: parts.length,
      low: lowCount,
      zones: zones.size,
      todayOut,
    };
  }, [parts, outbounds]);

  // 选项
  const zones = useMemo(
    () => Array.from(new Set(parts.map((p) => p.zone).filter(Boolean))).sort(),
    [parts]
  );
  const categories = useMemo(
    () => Array.from(new Set(parts.map((p) => p.category).filter(Boolean))).sort(),
    [parts]
  );

  // 过滤 + 排序
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let list = parts.filter((p) => {
      const matchKw =
        !kw ||
        [p.name, p.spec, p.zone, p.shelf, p.layer, p.bin, p.category]
          .some((v) => v.toLowerCase().includes(kw));
      const matchZone = !zoneFilter || p.zone === zoneFilter;
      const matchCat = !categoryFilter || p.category === categoryFilter;
      return matchKw && matchZone && matchCat;
    });
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "zh");
      if (sortKey === "quantity") return b.quantity - a.quantity;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [parts, keyword, zoneFilter, categoryFilter, sortKey]);

  const handleExport = () => {
    if (parts.length === 0 && assemblies.length === 0) {
      alert("暂无数据可导出");
      return;
    }
    exportData(parts, outbounds, assemblies, pickTasks);
  };

  const handleImportClick = (mode: "replace" | "merge") => {
    setImportMode(mode);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseImportFile(file);
      if (importMode === "replace") {
        if (!confirm(`将覆盖现有数据：${data.parts.length} 条配件，确认？`)) return;
        replaceAll(data.parts, data.outbounds, data.assemblies, data.pickTasks);
      } else {
        mergeData(data.parts, data.outbounds, data.assemblies, data.pickTasks);
      }
      alert(`导入完成：${data.parts.length} 条配件`);
    } catch (err) {
      alert("导入失败：" + (err as Error).message);
    } finally {
      e.target.value = "";
    }
  };

  const hasFilter = zoneFilter || categoryFilter;

  // 云端同步 - 推送
  const handleSyncPush = async () => {
    const cfg = getSyncConfig();
    if (!cfg) return;
    setSyncStatus("syncing");
    try {
      const { sha } = await pullRemoteData(cfg);
      const data = buildExportData(parts, outbounds, assemblies, pickTasks);
      await pushRemoteData(cfg, data, sha || undefined);
      const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      setLastSyncTime(now);
      localStorage.setItem("parts_manager_last_sync", now);
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (err) {
      alert("推送失败：" + (err as Error).message);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  // 云端同步 - 拉取
  const handleSyncPull = async () => {
    const cfg = getSyncConfig();
    if (!cfg) return;
    setSyncStatus("syncing");
    try {
      const { data } = await pullRemoteData(cfg);
      if (!data) {
        alert("云端暂无数据，请先推送");
        setSyncStatus("idle");
        return;
      }
      const merged = mergeRemoteToLocal(parts, outbounds, assemblies, pickTasks, data);
      if (merged.added === 0) {
        alert("已是最新，无需更新");
      } else {
        replaceAll(merged.parts, merged.outbounds, merged.assemblies, merged.pickTasks);
        alert(`拉取完成：新增 ${merged.added} 条记录`);
      }
      const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      setLastSyncTime(now);
      localStorage.setItem("parts_manager_last_sync", now);
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (err) {
      alert("拉取失败：" + (err as Error).message);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  return (
    <Layout onExport={handleExport} onImport={() => handleImportClick("merge")} onSyncPush={handleSyncPush} onSyncPull={handleSyncPull} syncStatus={syncStatus} lastSyncTime={lastSyncTime}>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 搜索栏 */}
      <div className="relative mb-6 animate-fade-up">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400"
            />
            <input
              className="w-full pl-11 pr-4 py-3 text-base bg-white border-2 border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400 placeholder:text-steel-400 transition-colors"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入中文名 / 规格 / 位置关键字…"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-steel-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fade-up">
        <StatCard
          label="配件总数"
          value={stats.total}
          icon={Package}
          hint="条记录"
        />
        <StatCard
          label="库存预警"
          value={stats.low}
          icon={AlertTriangle}
          tone="warning"
          hint="低于安全库存"
        />
        <StatCard
          label="库区数量"
          value={stats.zones}
          icon={Map}
          tone="info"
          hint="个库区"
        />
        <StatCard
          label="今日出库"
          value={stats.todayOut}
          icon={PackageCheck}
          hint="次"
        />
      </div>

      <div className="flex gap-6">
        {/* 筛选侧栏 */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white border border-steel-200 rounded-sm p-4 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-hazard-600" />
              <h3 className="font-bold text-steel-800 text-sm">筛选</h3>
              {hasFilter && (
                <button
                  onClick={() => {
                    setZoneFilter("");
                    setCategoryFilter("");
                  }}
                  className="ml-auto text-xs text-steel-400 hover:text-red-500"
                >
                  清除
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-steel-500 mb-1.5">库区</p>
                <select
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400"
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                >
                  <option value="">全部</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-steel-500 mb-1.5">分类</p>
                <select
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">全部</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-steel-500 mb-1.5">排序</p>
                <select
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* 配件表格 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-steel-500">
              共 <span className="font-mono-num font-bold text-steel-800">{filtered.length}</span> 条
              {filtered.length !== parts.length && (
                <span className="text-steel-400"> / {parts.length}</span>
              )}
            </p>
            {/* 移动端排序 */}
            <select
              className="lg:hidden px-2.5 py-1.5 text-sm bg-white border border-steel-300 rounded-sm focus:outline-none focus:border-hazard-400"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <PartsTable parts={filtered} />
        </div>
      </div>
    </Layout>
  );
}
