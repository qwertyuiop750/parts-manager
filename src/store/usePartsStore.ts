import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Part,
  OutboundRecord,
  PartFormData,
  AssemblyList,
  AssemblyItem,
  PickTask,
} from "@/types";
import { uid } from "@/utils/format";

interface PartsState {
  parts: Part[];
  outbounds: OutboundRecord[];
  assemblies: AssemblyList[];
  pickTasks: PickTask[];

  // 配件 CRUD
  addPart: (data: PartFormData) => Part;
  updatePart: (id: string, data: PartFormData) => void;
  deletePart: (id: string) => void;
  getPart: (id: string) => Part | undefined;

  // 出库
  addOutbound: (partId: string, quantity: number, receiver: string, remark: string) => boolean;
  getOutboundsByPart: (partId: string) => OutboundRecord[];

  // 组装清单 CRUD
  addAssembly: (name: string, remark: string, items: AssemblyItem[]) => AssemblyList;
  updateAssembly: (id: string, name: string, remark: string, items: AssemblyItem[]) => void;
  deleteAssembly: (id: string) => void;

  // 领料任务
  startPickTask: (assemblyListId: string, receiver: string) => PickTask | null;
  togglePickItem: (taskId: string, partId: string) => void;
  completePickTask: (taskId: string) => { ok: boolean; reason?: string };
  deletePickTask: (taskId: string) => void;

  // 数据导入导出
  replaceAll: (parts: Part[], outbounds: OutboundRecord[], assemblies?: AssemblyList[], pickTasks?: PickTask[]) => void;
  mergeData: (parts: Part[], outbounds: OutboundRecord[], assemblies?: AssemblyList[], pickTasks?: PickTask[]) => void;
}

export const usePartsStore = create<PartsState>()(
  persist(
    (set, get) => ({
      parts: [],
      outbounds: [],
      assemblies: [],
      pickTasks: [],

      addPart: (data) => {
        const now = new Date().toISOString();
        const part: Part = {
          ...data,
          id: uid(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ parts: [part, ...state.parts] }));
        return part;
      },

      updatePart: (id, data) => {
        const now = new Date().toISOString();
        set((state) => ({
          parts: state.parts.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now } : p
          ),
        }));
      },

      deletePart: (id) => {
        set((state) => ({
          parts: state.parts.filter((p) => p.id !== id),
          outbounds: state.outbounds.filter((o) => o.partId !== id),
          assemblies: state.assemblies.map((a) => ({
            ...a,
            items: a.items.filter((it) => it.partId !== id),
          })),
          pickTasks: state.pickTasks.map((t) => ({
            ...t,
            items: t.items.filter((it) => it.partId !== id),
          })),
        }));
      },

      getPart: (id) => get().parts.find((p) => p.id === id),

      addOutbound: (partId, quantity, receiver, remark) => {
        const part = get().parts.find((p) => p.id === partId);
        if (!part) return false;
        if (quantity <= 0 || quantity > part.quantity) return false;

        const record: OutboundRecord = {
          id: uid(),
          partId,
          quantity,
          receiver: receiver.trim(),
          remark: remark.trim(),
          timestamp: new Date().toISOString(),
        };
        const now = new Date().toISOString();
        set((state) => ({
          outbounds: [record, ...state.outbounds],
          parts: state.parts.map((p) =>
            p.id === partId
              ? { ...p, quantity: p.quantity - quantity, updatedAt: now }
              : p
          ),
        }));
        return true;
      },

      getOutboundsByPart: (partId) =>
        get()
          .outbounds.filter((o) => o.partId === partId)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),

      // ===== 组装清单 =====
      addAssembly: (name, remark, items) => {
        const now = new Date().toISOString();
        const assembly: AssemblyList = {
          id: uid(),
          name: name.trim(),
          remark: remark.trim(),
          items,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ assemblies: [assembly, ...state.assemblies] }));
        return assembly;
      },

      updateAssembly: (id, name, remark, items) => {
        const now = new Date().toISOString();
        set((state) => ({
          assemblies: state.assemblies.map((a) =>
            a.id === id ? { ...a, name: name.trim(), remark: remark.trim(), items, updatedAt: now } : a
          ),
        }));
      },

      deleteAssembly: (id) => {
        set((state) => ({
          assemblies: state.assemblies.filter((a) => a.id !== id),
        }));
      },

      // ===== 领料任务 =====
      startPickTask: (assemblyListId, receiver) => {
        const list = get().assemblies.find((a) => a.id === assemblyListId);
        if (!list || list.items.length === 0) return null;
        const task: PickTask = {
          id: uid(),
          assemblyListId,
          assemblyName: list.name,
          receiver: receiver.trim(),
          items: list.items.map((it) => ({
            partId: it.partId,
            quantity: it.quantity,
            found: false,
          })),
          status: "picking",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ pickTasks: [task, ...state.pickTasks] }));
        return task;
      },

      togglePickItem: (taskId, partId) => {
        set((state) => ({
          pickTasks: state.pickTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  items: t.items.map((it) =>
                    it.partId === partId ? { ...it, found: !it.found } : it
                  ),
                }
              : t
          ),
        }));
      },

      completePickTask: (taskId) => {
        const task = get().pickTasks.find((t) => t.id === taskId);
        if (!task) return { ok: false, reason: "任务不存在" };
        if (task.items.some((it) => !it.found)) {
          return { ok: false, reason: "还有配件未找到" };
        }
        // 校验库存是否足够
        const parts = get().parts;
        for (const it of task.items) {
          const p = parts.find((pp) => pp.id === it.partId);
          if (!p) return { ok: false, reason: "配件不存在" };
          if (it.quantity > p.quantity) {
            return { ok: false, reason: `${p.name} 库存不足（需要 ${it.quantity}，现有 ${p.quantity}）` };
          }
        }
        // 批量出库
        const now = new Date().toISOString();
        const receiver = task.receiver || "领料";
        const newRecords: OutboundRecord[] = task.items.map((it) => ({
          id: uid(),
          partId: it.partId,
          quantity: it.quantity,
          receiver,
          remark: `组装领料：${task.assemblyName}`,
          timestamp: now,
        }));
        set((state) => ({
          outbounds: [...newRecords, ...state.outbounds],
          parts: state.parts.map((p) => {
            const it = task.items.find((i) => i.partId === p.id);
            return it ? { ...p, quantity: p.quantity - it.quantity, updatedAt: now } : p;
          }),
          pickTasks: state.pickTasks.map((t) =>
            t.id === taskId ? { ...t, status: "done", completedAt: now } : t
          ),
        }));
        return { ok: true };
      },

      deletePickTask: (taskId) => {
        set((state) => ({
          pickTasks: state.pickTasks.filter((t) => t.id !== taskId),
        }));
      },

      // ===== 导入导出 =====
      replaceAll: (parts, outbounds, assemblies, pickTasks) =>
        set({
          parts,
          outbounds,
          assemblies: assemblies ?? [],
          pickTasks: pickTasks ?? [],
        }),

      mergeData: (parts, outbounds, assemblies, pickTasks) =>
        set((state) => {
          const existingIds = new Set(state.parts.map((p) => p.id));
          const existingOutIds = new Set(state.outbounds.map((o) => o.id));
          const newParts = parts.filter((p) => !existingIds.has(p.id));
          const newOutbounds = outbounds.filter((o) => !existingOutIds.has(o.id));
          return {
            parts: [...newParts, ...state.parts],
            outbounds: [...newOutbounds, ...state.outbounds],
            assemblies: assemblies ? [...assemblies, ...state.assemblies] : state.assemblies,
            pickTasks: pickTasks ? [...pickTasks, ...state.pickTasks] : state.pickTasks,
          };
        }),
    }),
    {
      name: "parts_manager_v1",
    }
  )
);
