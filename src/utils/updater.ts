/**
 * GitHub Releases 自动更新模块
 * 检查最新版本 → 对比当前版本 → 提供下载链接
 */

const OWNER = "qwertyuiop750";
const REPO = "parts-manager";
const RELEASES_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const CACHE_KEY = "parts_manager_update_cache";
const CACHE_TTL = 1000 * 60 * 60; // 1 小时缓存

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

interface CacheEntry {
  info: UpdateInfo;
  timestamp: number;
}

function parseVersion(tag: string): string {
  return tag.replace(/^v/, "");
}

/** 比较两个 semver 版本号，返回 1(更新) / 0(相同) / -1(更旧) */
function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export function getCurrentVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).__APP_VERSION__ ?? "1.0.0";
}

/** 检查是否有新版本 */
export async function checkForUpdate(forceRefresh = false): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion();

  // 先查缓存（除非强制刷新）
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (Date.now() - entry.timestamp < CACHE_TTL) {
          return entry.info;
        }
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const res = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (!res.ok) {
      throw new Error(`GitHub API 返回 ${res.status}`);
    }

    const data = await res.json();
    const latestVersion = parseVersion(data.tag_name ?? "v0.0.0");
    const hasUpdate = compareSemver(latestVersion, currentVersion) > 0;

    // 找 APK 下载链接（优先 debug APK）
    const assets = data.assets ?? [];
    let downloadUrl = data.html_url ?? ""; // 回退到 Release 页面
    for (const asset of assets) {
      const name: string = asset.name ?? "";
      if (name.endsWith(".apk")) {
        downloadUrl = asset.browser_download_url;
        break;
      }
    }
    if (!downloadUrl && assets.length > 0) {
      downloadUrl = assets[0].browser_download_url;
    }

    const info: UpdateInfo = {
      hasUpdate,
      currentVersion,
      latestVersion,
      downloadUrl,
      releaseNotes: data.body ?? "",
      publishedAt: data.published_at ?? "",
    };

    // 写入缓存
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ info, timestamp: Date.now() })
    );

    return info;
  } catch {
    // 网络错误时返回无更新
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      downloadUrl: "",
      releaseNotes: "",
      publishedAt: "",
    };
  }
}

/** 打开下载链接（HBuilderX 原生用 plus.runtime.openURL，Web 端直接跳转） */
export async function openDownloadUrl(url: string): Promise<void> {
  // @ts-ignore
  if (typeof plus !== 'undefined') {
    // @ts-ignore
    plus.runtime.openURL(url);
  } else {
    window.open(url, "_blank");
  }
}

/** 清除更新缓存 */
export function clearUpdateCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
