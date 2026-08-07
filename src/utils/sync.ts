/**
 * GitHub API 同步模块
 * 通过 GitHub Contents API 读写仓库中的 JSON 数据文件，实现跨设备同步
 */
import type { ExportData, Part, OutboundRecord, AssemblyList, PickTask } from "@/types";

const SYNC_FILE_PATH = "sync-data.json";
const STORAGE_KEY = "parts_manager_sync_config";

export interface SyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

interface RemoteFile {
  sha: string;
  content: string;
}

export function getSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSyncConfig(cfg: SyncConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearSyncConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSyncConfigured(): boolean {
  const cfg = getSyncConfig();
  return !!(cfg?.token && cfg?.owner && cfg?.repo);
}

function apiUrl(cfg: SyncConfig, path: string): string {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

/** 从远程仓库读取同步数据文件 */
export async function pullRemoteData(
  cfg: SyncConfig
): Promise<{ data: ExportData | null; sha: string }> {
  const url = `${apiUrl(cfg, SYNC_FILE_PATH)}?ref=${cfg.branch}&t=${Date.now()}`;
  const res = await fetch(url, { headers: headers(cfg.token) });

  if (res.status === 404) {
    return { data: null, sha: "" };
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`拉取失败 (${res.status}): ${msg}`);
  }

  const json: RemoteFile = await res.json();
  const decoded = atob(json.content.replace(/\n/g, ""));
  const data: ExportData = JSON.parse(decoded);
  return { data, sha: json.sha };
}

/** 推送数据到远程仓库 */
export async function pushRemoteData(
  cfg: SyncConfig,
  exportData: ExportData,
  existingSha?: string
): Promise<string> {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(exportData, null, 2))));

  const body: Record<string, string> = {
    message: `sync: ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
    content,
    branch: cfg.branch,
  };
  if (existingSha) {
    body.sha = existingSha;
  }

  const res = await fetch(apiUrl(cfg, SYNC_FILE_PATH), {
    method: "PUT",
    headers: headers(cfg.token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`推送失败 (${res.status}): ${msg}`);
  }

  const json = await res.json();
  return json.content.sha as string;
}

/** 验证 Token 和仓库是否可访问 */
export async function validateSyncConfig(cfg: SyncConfig): Promise<boolean> {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
  const res = await fetch(url, { headers: headers(cfg.token) });
  if (!res.ok) return false;
  const data = await res.json();
  return data.permissions?.push === true;
}

/** 构建导出数据 */
export function buildExportData(
  parts: Part[],
  outbounds: OutboundRecord[],
  assemblies: AssemblyList[],
  pickTasks: PickTask[]
): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    parts,
    outbounds,
    assemblies,
    pickTasks,
  };
}

/** 合并远程和本地数据（以 ID 去重，远程优先） */
export function mergeRemoteToLocal(
  localParts: Part[],
  localOutbounds: OutboundRecord[],
  localAssemblies: AssemblyList[],
  localPickTasks: PickTask[],
  remote: ExportData
): {
  parts: Part[];
  outbounds: OutboundRecord[];
  assemblies: AssemblyList[];
  pickTasks: PickTask[];
  added: number;
} {
  const localPartIds = new Set(localParts.map((p) => p.id));
  const localOutIds = new Set(localOutbounds.map((o) => o.id));
  const localAsmIds = new Set(localAssemblies.map((a) => a.id));
  const localPickIds = new Set(localPickTasks.map((t) => t.id));

  const newParts = (remote.parts ?? []).filter((p) => !localPartIds.has(p.id));
  const newOutbounds = (remote.outbounds ?? []).filter((o) => !localOutIds.has(o.id));
  const newAssemblies = (remote.assemblies ?? []).filter((a) => !localAsmIds.has(a.id));
  const newPickTasks = (remote.pickTasks ?? []).filter((t) => !localPickIds.has(t.id));

  return {
    parts: [...newParts, ...localParts],
    outbounds: [...newOutbounds, ...localOutbounds],
    assemblies: [...newAssemblies, ...localAssemblies],
    pickTasks: [...newPickTasks, ...localPickTasks],
    added: newParts.length + newOutbounds.length + newAssemblies.length + newPickTasks.length,
  };
}
