import type { ExportData, Part, OutboundRecord, AssemblyList, PickTask } from "@/types";

/** 导出数据为 JSON 文件 */
export function exportData(
  parts: Part[],
  outbounds: OutboundRecord[],
  assemblies: AssemblyList[] = [],
  pickTasks: PickTask[] = []
): void {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    parts,
    outbounds,
    assemblies,
    pickTasks,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `配件数据备份_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 读取并解析导入的 JSON 文件 */
export function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.parts || !Array.isArray(parsed.parts)) {
          throw new Error("文件格式不正确：缺少 parts 字段");
        }
        resolve(parsed as ExportData);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file);
  });
}
