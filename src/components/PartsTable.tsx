import { Link } from "react-router-dom";
import { Eye, Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Part } from "@/types";
import { isLowStock } from "@/utils/format";
import LocationBadge from "@/components/LocationBadge";
import { cn } from "@/lib/utils";

interface PartsTableProps {
  parts: Part[];
}

export default function PartsTable({ parts }: PartsTableProps) {
  if (parts.length === 0) {
    return (
      <div className="bg-white border border-steel-200 rounded-sm py-16 text-center">
        <p className="text-steel-400 text-sm">未找到匹配的配件</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-steel-200 rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-stripe text-sm">
          <thead>
            <tr className="bg-steel-800 text-white text-left">
              <th className="px-3 py-3 font-medium w-12 text-center">#</th>
              <th className="px-3 py-3 font-medium">中文名</th>
              <th className="px-3 py-3 font-medium">规格</th>
              <th className="px-3 py-3 font-medium">位置</th>
              <th className="px-3 py-3 font-medium hidden md:table-cell">分类</th>
              <th className="px-3 py-3 font-medium text-right">库存</th>
              <th className="px-3 py-3 font-medium text-center">状态</th>
              <th className="px-3 py-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part, idx) => {
              const low = isLowStock(part);
              return (
                <tr
                  key={part.id}
                  className="border-t border-steel-100 hover:bg-hazard-50/50 transition-colors"
                >
                  <td className="px-3 py-2.5 text-center text-steel-400 font-mono-num">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {part.image && (
                        <img
                          src={part.image}
                          alt={part.name}
                          className="w-9 h-9 rounded-sm object-cover border border-steel-200 shrink-0"
                        />
                      )}
                      <Link
                        to={`/detail/${part.id}`}
                        className="font-medium text-steel-800 hover:text-hazard-600"
                      >
                        {part.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono-num text-steel-600">
                    {part.spec}
                  </td>
                  <td className="px-3 py-2.5">
                    <LocationBadge part={part} />
                  </td>
                  <td className="px-3 py-2.5 text-steel-500 hidden md:table-cell">
                    {part.category || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono-num">
                    <span
                      className={cn(
                        "font-bold",
                        low ? "text-red-600" : "text-steel-800"
                      )}
                    >
                      {part.quantity}
                    </span>
                    <span className="text-steel-400 text-xs ml-0.5">
                      {part.unit}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {low ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-sm">
                        <AlertTriangle size={12} />
                        预警
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-sm">
                        <CheckCircle2 size={12} />
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/detail/${part.id}`}
                        className="p-1.5 text-steel-500 hover:text-hazard-600 hover:bg-hazard-50 rounded-sm transition-colors"
                        title="查看详情"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/edit/${part.id}`}
                        className="p-1.5 text-steel-500 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                        title="编辑"
                      >
                        <Pencil size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
