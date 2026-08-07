// 配件信息
export interface Part {
  id: string;
  name: string; // 中文名
  spec: string; // 规格
  category: string; // 分类
  unit: string; // 单位（个/件/套）
  zone: string; // 库区
  shelf: string; // 货架
  layer: string; // 层
  bin: string; // 位
  quantity: number; // 当前库存
  safetyStock: number; // 安全库存阈值
  remark: string; // 备注
  image?: string; // 配件图片（data URL）
  createdAt: string;
  updatedAt: string;
}

// 出库记录
export interface OutboundRecord {
  id: string;
  partId: string;
  quantity: number;
  receiver: string; // 领用人
  remark: string;
  timestamp: string;
}

// 新增/编辑表单数据（不含 id 与时间戳）
export type PartFormData = Omit<Part, "id" | "createdAt" | "updatedAt">;

// 排序方式
export type SortKey = "updatedAt" | "name" | "quantity";

// 组装清单条目
export interface AssemblyItem {
  partId: string;
  quantity: number;
}

// 组装清单（BOM）：一台设备需要的配件清单
export interface AssemblyList {
  id: string;
  name: string; // 设备名称，如"装配机A型"
  remark: string;
  items: AssemblyItem[];
  createdAt: string;
  updatedAt: string;
}

// 领料任务条目
export interface PickItem {
  partId: string;
  quantity: number;
  found: boolean; // 是否已找到
}

// 领料任务状态
export type PickStatus = "picking" | "done";

// 领料任务：从组装清单发起的一次领料核对
export interface PickTask {
  id: string;
  assemblyListId: string;
  assemblyName: string;
  receiver: string; // 领用人
  items: PickItem[];
  status: PickStatus;
  createdAt: string;
  completedAt?: string;
}

// 导出数据结构
export interface ExportData {
  version: number;
  exportedAt: string;
  parts: Part[];
  outbounds: OutboundRecord[];
  assemblies?: AssemblyList[];
  pickTasks?: PickTask[];
}
