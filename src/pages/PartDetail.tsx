import { useState, useMemo } from "react";
import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  Tag,
  Boxes,
  Clock,
  History,
  User,
  type LucideIcon,
} from "lucide-react";
import { usePartsStore } from "@/store/usePartsStore";
import {
  locationPath,
  isLowStock,
  formatDateTime,
} from "@/utils/format";
import Layout from "@/components/Layout";
import OutboundForm from "@/components/OutboundForm";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function PartDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const part = usePartsStore((s) => s.parts.find((p) => p.id === id));
  const allOutbounds = usePartsStore((s) => s.outbounds);
  const deletePart = usePartsStore((s) => s.deletePart);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const outbounds = useMemo(
    () => (id ? allOutbounds.filter((o) => o.partId === id) : []),
    [allOutbounds, id]
  );

  if (!id || !part) {
    return <Navigate to="/" replace />;
  }

  const low = isLowStock(part);
  const path = locationPath(part);
  const sortedOutbounds = [...outbounds].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );

  const handleDelete = () => {
    deletePart(part.id);
    navigate("/");
  };

  return (
    <Layout>
      <div className="max-w-4xl animate-fade-up">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-steel-600 hover:text-steel-900"
          >
            <ArrowLeft size={18} />
            返回台账
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={`/edit/${part.id}`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-sm transition-colors"
            >
              <Pencil size={15} />
              编辑
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-sm transition-colors"
            >
              <Trash2 size={15} />
              删除
            </button>
          </div>
        </div>

        {/* 位置指引卡片 */}
        <div className="bg-hazard-400 border-2 border-hazard-500 rounded-sm p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-hazard-300/40 rounded-full -translate-y-12 translate-x-12" />
          <div className="relative">
            <div className="flex items-center gap-2 text-steel-900/70 text-sm font-medium mb-2">
              <MapPin size={16} strokeWidth={2.5} />
              仓位位置
            </div>
            <p className="text-3xl font-bold font-mono-num text-steel-900 break-all">
              {path || "未设置位置"}
            </p>
            <p className="mt-2 text-sm text-steel-800/70">
              按以上路径前往取件
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：配件信息 + 出库记录 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 配件信息 */}
            <section className="bg-white border border-steel-200 rounded-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-steel-50 border-b border-steel-200">
                <Package size={18} className="text-hazard-600" />
                <h3 className="font-bold text-steel-800">配件信息</h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
                {part.image && (
                  <div className="col-span-2 mb-2">
                    <p className="text-xs text-steel-500 mb-1.5">配件图片</p>
                    <img
                      src={part.image}
                      alt={part.name}
                      className="max-h-48 rounded-sm border border-steel-200 object-contain"
                    />
                  </div>
                )}
                <InfoItem icon={Tag} label="中文名" value={part.name} />
                <InfoItem
                  icon={Tag}
                  label="规格"
                  value={part.spec}
                  mono
                />
                <InfoItem
                  icon={Boxes}
                  label="分类"
                  value={part.category || "—"}
                />
                <InfoItem icon={Package} label="单位" value={part.unit} />
                <div>
                  <p className="text-xs text-steel-500 mb-1">当前库存</p>
                  <p
                    className={`text-2xl font-bold font-mono-num ${
                      low ? "text-red-600" : "text-steel-800"
                    }`}
                  >
                    {part.quantity}
                    <span className="text-sm font-normal text-steel-400 ml-1">
                      {part.unit}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel-500 mb-1">安全库存</p>
                  <p className="text-2xl font-bold font-mono-num text-steel-800">
                    {part.safetyStock}
                    <span className="text-sm font-normal text-steel-400 ml-1">
                      {part.unit}
                    </span>
                  </p>
                </div>
                {part.remark && (
                  <div className="col-span-2">
                    <p className="text-xs text-steel-500 mb-1">备注</p>
                    <p className="text-sm text-steel-700 bg-steel-50 px-3 py-2 rounded-sm">
                      {part.remark}
                    </p>
                  </div>
                )}
                <div className="col-span-2 flex items-center gap-4 pt-2 border-t border-steel-100 text-xs text-steel-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    创建：{formatDateTime(part.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    更新：{formatDateTime(part.updatedAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* 出库记录 */}
            <section className="bg-white border border-steel-200 rounded-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-steel-50 border-b border-steel-200">
                <History size={18} className="text-hazard-600" />
                <h3 className="font-bold text-steel-800">出库记录</h3>
                <span className="ml-auto text-xs text-steel-400 font-mono-num">
                  共 {sortedOutbounds.length} 条
                </span>
              </div>
              <div className="p-5">
                {sortedOutbounds.length === 0 ? (
                  <p className="text-center text-steel-400 text-sm py-8">
                    暂无出库记录
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {sortedOutbounds.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-start gap-3 pb-3 border-b border-steel-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-red-50 text-red-500 rounded-sm shrink-0">
                          <Package size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold font-mono-num text-red-600">
                              -{o.quantity}
                            </span>
                            <span className="text-sm text-steel-400">
                              {part.unit}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-steel-600">
                              <User size={12} />
                              {o.receiver || "—"}
                            </span>
                          </div>
                          {o.remark && (
                            <p className="text-xs text-steel-500 mt-0.5">
                              {o.remark}
                            </p>
                          )}
                          <p className="text-xs text-steel-400 mt-0.5 font-mono-num">
                            {formatDateTime(o.timestamp)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* 右侧：出库操作 + 预警提示 */}
          <div className="space-y-4">
            {low && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                <AlertTriangle size={18} />
                <span>
                  库存预警：当前 {part.quantity}
                  {part.unit}，已低于安全库存 {part.safetyStock}
                  {part.unit}
                </span>
              </div>
            )}
            {part.quantity <= 0 ? (
              <div className="bg-white border border-steel-200 rounded-sm p-6 text-center text-steel-400 text-sm">
                库存为 0，无法出库
              </div>
            ) : (
              <OutboundForm part={part} />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="删除配件"
        message={`确认删除「${part.name}」？该配件的出库记录也将一并删除，操作不可撤销。`}
        confirmText="确认删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-steel-500 mb-1 flex items-center gap-1">
        <Icon size={12} />
        {label}
      </p>
      <p className={`text-steel-800 ${mono ? "font-mono-num" : ""}`}>{value}</p>
    </div>
  );
}
