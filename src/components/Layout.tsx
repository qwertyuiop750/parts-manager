import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Boxes,
  Plus,
  Download,
  Upload,
  ClipboardList,
  Warehouse,
  Settings,
  Cloud,
  CloudOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ApiSettingsDialog from "@/components/ApiSettingsDialog";
import SyncSettingsDialog from "@/components/SyncSettingsDialog";
import { isSyncConfigured } from "@/utils/sync";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

interface LayoutProps {
  children: React.ReactNode;
  onExport?: () => void;
  onImport?: () => void;
  onSyncPush?: () => void;
  onSyncPull?: () => void;
  syncStatus?: SyncStatus;
  lastSyncTime?: string;
}

const NAV_ITEMS = [
  { to: "/", label: "配件台账", icon: Warehouse },
  { to: "/assemblies", label: "组装清单", icon: ClipboardList },
];

export default function Layout({ children, onExport, onImport, onSyncPush, onSyncPull, syncStatus, lastSyncTime }: LayoutProps) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col bg-steel-100">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-30 bg-steel-800 text-white shadow-lg" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="flex items-center justify-center w-10 h-10 bg-hazard-400 text-steel-900 rounded-sm group-hover:bg-hazard-300 transition-colors">
                  <Boxes size={24} strokeWidth={2.5} />
                </div>
                <div className="leading-tight hidden sm:block">
                  <h1 className="font-bold text-lg tracking-wide">配件仓位管家</h1>
                  <p className="text-[11px] text-steel-400 font-mono-num">
                    PARTS · LOCATION · MANAGER
                  </p>
                </div>
              </Link>

              {/* 导航链接 */}
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                        active
                          ? "bg-steel-700 text-hazard-300"
                          : "text-steel-300 hover:text-white hover:bg-steel-700/60"
                      )}
                    >
                      <Icon size={16} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {isHome && (
                <>
                  <button
                    onClick={onImport}
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-steel-200 hover:text-white hover:bg-steel-700 rounded-sm transition-colors"
                    title="导入数据"
                  >
                    <Upload size={16} />
                    <span>导入</span>
                  </button>
                  <button
                    onClick={onExport}
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-steel-200 hover:text-white hover:bg-steel-700 rounded-sm transition-colors"
                    title="导出数据"
                  >
                    <Download size={16} />
                    <span>导出</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center justify-center w-9 h-9 text-steel-200 hover:text-white hover:bg-steel-700 rounded-sm transition-colors"
                title="识别接口设置"
              >
                <Settings size={18} />
              </button>
              {/* 同步按钮 */}
              {isSyncConfigured() ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={onSyncPull}
                    disabled={syncStatus === "syncing"}
                    className="flex items-center justify-center w-9 h-9 text-steel-200 hover:text-white hover:bg-steel-700 rounded-sm transition-colors disabled:opacity-50"
                    title="从云端拉取"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={onSyncPush}
                    disabled={syncStatus === "syncing"}
                    className="flex items-center justify-center w-9 h-9 text-steel-200 hover:text-white hover:bg-steel-700 rounded-sm transition-colors disabled:opacity-50"
                    title="推送到云端"
                  >
                    {syncStatus === "syncing" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : syncStatus === "success" ? (
                      <Cloud size={16} className="text-green-400" />
                    ) : syncStatus === "error" ? (
                      <CloudOff size={16} className="text-red-400" />
                    ) : (
                      <Cloud size={16} />
                    )}
                  </button>
                  {lastSyncTime && (
                    <span className="text-[10px] text-steel-500 font-mono-num hidden lg:inline">
                      {lastSyncTime}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSyncSettingsOpen(true)}
                  className="flex items-center justify-center w-9 h-9 text-steel-200 hover:text-white hover:bg-steel-700 rounded-sm transition-colors"
                  title="设置云端同步"
                >
                  <CloudOff size={18} />
                </button>
              )}
              <Link
                to="/add"
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-sm transition-colors",
                  "bg-hazard-400 text-steel-900 hover:bg-hazard-300"
                )}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">新增配件</span>
              </Link>
            </div>
          </div>
        </div>
        {/* 警示条 */}
        <div className="h-1 bg-gradient-to-r from-hazard-400 via-hazard-300 to-hazard-400" />
      </header>

      {/* 主内容 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* 底栏 */}
      <footer className="bg-steel-800 text-steel-400 text-xs py-3" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span>数据本地存储 · 支持云端同步</span>
          <span className="font-mono-num">v1.1</span>
        </div>
      </footer>

      <ApiSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <SyncSettingsDialog
        open={syncSettingsOpen}
        onClose={() => setSyncSettingsOpen(false)}
      />
    </div>
  );
}
